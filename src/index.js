/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */

var fs                  = require("fs"),
	path                = require('path'),
	util                = require('util'),
	helper              = require("./helper.js"),
	ConfigParser        = require("./configParser.js"),
	Dictionary          = require("./dictionary.js"),
	TextureMapGenerator = require('./textureMapGenerator/textureMapGenerator.js'),
	_startTime          = Date.now(),
	ClusterQueue        = require("./modules/clusterQueue/clusterQueue.js");

function Texturer () {
	this._cq = new ClusterQueue({
		file : path.resolve(__dirname, "cluster", "tasks.js")
		//, maxSimultaneousTasks : 1
	});
}

Texturer.prototype = {
	/**
	 * @param configJSONString
	 * @param {function(this:T) : string|null } callback Returns null if success, or error text in case error occurred
	 * @param {T} thisArg
	 * @template T
	 */
	generate : function (configJSONString, callback, thisArg) {
		this._cq.restart();

		this._callback = callback;
		this._thisArg = thisArg;

		try {
			this._configParser = new ConfigParser(configJSONString);
			this._textureMapArray = [];
			//this._loadedFileDataDictionary = {};

			this._loadedFilesDictionary = new Dictionary();

			this._loadedFilesCount = 0;
			this._totalFilesCount = 0;
			this._totalTexturMapsRequiredCount = 0;

			this._loadFiles();
		} catch (e) {
			this._shutdown(e);
		}
	},

	_loadFiles : function () {
		this._configParser.getTextureMapConfigArray().forEach(function (textureMapConfig) {
			this._totalFilesCount += textureMapConfig.getFiles().length;
			if (textureMapConfig.getJustCopy()) {
				this._totalTexturMapsRequiredCount += textureMapConfig.getFiles().length;
			} else {
				this._totalTexturMapsRequiredCount++;
			}
		}, this);

		this._configParser.getTextureMapConfigArray().forEach(this._loadFilesForTextureMap, this);
	},

	/** @param {TextureMapConfig} textureMapConfig */
	_loadFilesForTextureMap : function (textureMapConfig) {
		textureMapConfig.getFiles().forEach(function (file) {
			helper.readImageFile(path.join(this._configParser.getFolderRootFrom(), file), function (error, instance) {
				if (error) {
					this._shutdown(error);
				} else {
					var loadedDataDictionary = new Dictionary(),
						trim = {left : 0, right : 0, top : 0, bottom : 0};

					// trim image if it is part of sprite
					if (!textureMapConfig.getJustCopy()) {
						var trimResult = helper.trimImage(instance);

						// new trimmed png instance and trim parameters
						instance = trimResult.png;
						trim = trimResult.trim;
					}
					loadedDataDictionary.setValue("width", instance.width);
					loadedDataDictionary.setValue("height", instance.height);
					loadedDataDictionary.setValue("bitmap", instance.data);
					loadedDataDictionary.setValue("trim", trim);

					this._loadedFilesDictionary.setValue(file, loadedDataDictionary);

					this._loadedFilesCount++;
					if (this._totalFilesCount === this._loadedFilesCount) {
						logMemory("files loaded: " + this._totalFilesCount);
						this._generateTextureMaps();
					}
				}
			}, this);
		}, this);
	},

	_generateTextureMaps : function () {
		this._configParser.getTextureMapConfigArray().forEach(this._generateTextureMap, this);
	},

	_generateTextureMap : function (textureMapConfig) {
		if (textureMapConfig.getJustCopy()) {
			textureMapConfig.getFiles().forEach(function (file) {
				var fromFile = path.join(this._configParser.getFolderRootFrom(), file),
					toFile = path.join(this._configParser.getFolderRootTo(), file),
					loadedFileDictionary = this._loadedFilesDictionary.getValue(file),
					_this = this,
					copiedFilesCount = 0;

				try {
					helper.createDirectory(path.dirname(toFile));

					// check if file exists
					if (fs.existsSync(toFile)) {
						// remove read-only and other attributes
						fs.chmodSync(toFile, '0777');

						// delete file
						fs.unlinkSync(toFile);
					}
				} catch (e) {
					this._shutdown(new Error("COPY PREPARATION: " + e.toString()));
				}

				// fs.link(fromFile, toFile, function (error) {
				this._cq.runTask("copyFile", { source : fromFile, target : toFile }, function(error) {
					if (error) {
						_this._shutdown(new Error("" +
							"COPY: \n" +
							"src: " + fromFile + "\n" +
							"dst: " + toFile + "\n" +
							"error: " + error
						));
					}

					var textureMapDictionary = new Dictionary(),
						width = loadedFileDictionary.getValue("width"),
						height = loadedFileDictionary.getValue("height");

					textureMapDictionary.setValue("width", width);
					textureMapDictionary.setValue("height", height);
					textureMapDictionary.setValue("area", width * height);
					textureMapDictionary.setValue("repeat-x", false);
					textureMapDictionary.setValue("repeat-y", false);
					textureMapDictionary.setValue("base64", null);
					textureMapDictionary.setValue("file", file);

					textureMapDictionary.addValue("textures", {
						id     : file,
						x      : 0,
						y      : 0,
						width  : width,
						height : height,
						bitmap : loadedFileDictionary.getValue("bitmap"),
						trim   : loadedFileDictionary.getValue("trim")
					});

					_this._textureMapArray.push(textureMapDictionary);

					copiedFilesCount++;
					if (textureMapConfig.getFiles().length === copiedFilesCount) {
						_this._onTextureMapGenerated();
					}
				}, this);
			}, this);
		} else {
			// create size array (id/width/height)
			var sizeArray = [];
			textureMapConfig.getFiles().forEach(function (file) {
				var loadedFileDictionary = this._loadedFilesDictionary.getValue(file);
				sizeArray.push({
					id     : file,
					width  : loadedFileDictionary.getValue("width"),
					height : loadedFileDictionary.getValue("height")
				});
			}, this);

			var textureMapGenerator = new TextureMapGenerator(this._cq);
			textureMapGenerator.generateTextureMap(sizeArray, textureMapConfig, function (error, textureMapDictionary) {
				if (error) {
					this._shutdown(new Error("Texture Generator: Can't pack texture map '" + textureMapConfig.getPNGFileName() + "'. " + error));
				} else if (!textureMapDictionary) {
					this._shutdown(new Error("Texture Generator: Can't pack texture map '" + textureMapConfig.getPNGFileName() + "' - too large art. Split images into 2 or more folders!"));
				} else {
					this._compressTextureMapImage(textureMapConfig, textureMapDictionary);
				}
			}, this);
		}
	},

	/**
	 * @param textureMapConfig
	 * @param {Dictionary} textureMapDictionary
	 */
	_compressTextureMapImage : function (textureMapConfig, textureMapDictionary) {
		console.log(textureMapConfig.getPNGFileName() + ": w = " + textureMapDictionary.getValue("width") + ", h = " + textureMapDictionary.getValue("height") + ", area = " + textureMapDictionary.getValue("area"));

		var textureArray = [];
		textureMapDictionary.getValue("textures").forEach(function (texture) {
			var loadedFileDictionary = this._loadedFilesDictionary.getValue(texture.id);
			textureArray.push({
				x                : texture.x,
				y                : texture.y,
				width            : texture.width,
				height           : texture.height,
				bitmapSerialized : loadedFileDictionary.getValue("bitmap")//texture.data.png.data
			});
		}, this);

		var bestCompressedImage = null,
			filterCount = 0,
			filterTypes = [0, 1, 2, 3, 4];

		for (var i = 0; i < filterTypes.length; i++) {

			var data = {
				options      : textureMapConfig.getCompressionOptions(),
				filterType   : filterTypes[i],
				width        : textureMapDictionary.getValue("width"),
				height       : textureMapDictionary.getValue("height"),
				textureArray : textureArray
			};

			this._cq.runTask("compressPNG", data, function (error, result) {
				if (error) {
					this._shutdown(new Error(error));
				} else {
					// check if better compressed
					var compressedImage = new Buffer(result.compressedPNG);
					if (bestCompressedImage === null || compressedImage.length < bestCompressedImage.length) {
						bestCompressedImage = compressedImage;
					}

					// check if finished
					filterCount++;
					if (filterCount === filterTypes.length) {
						this._onTextureMapImageCompressed(textureMapConfig, textureMapDictionary, bestCompressedImage);
					}
				}
			}, this);
		}
	},

	/**
	 * @param textureMapConfig
	 * @param {Dictionary} textureMapDictionary
	 * @param compressedImage
	 */
	_onTextureMapImageCompressed : function (textureMapConfig, textureMapDictionary, compressedImage) {
		var base64 = "data:image/png;base64," + compressedImage.toString('base64');

		textureMapDictionary.setValue("base64", textureMapConfig.encodeDataURI() && base64.length < 32 * 1024 - 256 ? base64 : null);
		textureMapDictionary.setValue("file", textureMapConfig.getPNGFileName());

		// write png
		var file = path.join(this._configParser.getFolderRootTo(), textureMapConfig.getPNGFileName()),
			data = {
				file    : file,
				content : compressedImage,
				tinypng : {
					enabled    : !!textureMapConfig.getCompressionOptions()["tinypng"] && !textureMapConfig.getJustCopy(),
					configFile : "./config.json"
				}
			};
		this._cq.runTask("writeFile", data, function (error, result) {
			if (error) {
				this._shutdown(error);
			} else {
				this._textureMapArray.push(textureMapDictionary);
				this._onTextureMapGenerated();
			}
		}, this);
	},

	_onTextureMapGenerated : function () {
		if (this._textureMapArray.length === this._totalTexturMapsRequiredCount) {
			logMemory('build time: ' + (Date.now() - _startTime) + ' ms');
			helper.writeTexturePoolFile(this._configParser, this._loadedFilesDictionary, this._textureMapArray);

			this._shutdown(null);
		}
	},

	_shutdown : function (error) {
		if (error) {
			this._cq.abort();
			this._callback.call(this._thisArg, error);
		} else {
			this._cq.shutdown(function () {
				this._callback.call(this._thisArg, null);
			}, this);
		}
	}
};

var __logMemoryUsage = process.memoryUsage();
function logMemory (title) {
	console.log(title + "\nheapUsed: " + (process.memoryUsage().heapUsed - __logMemoryUsage.heapUsed + ", heapTotal: " + process.memoryUsage().heapTotal));
}

module.exports = Texturer;
