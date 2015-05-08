/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */

/// <reference path='./helper.ts' />
/// <reference path='./config.ts' />
/// <reference path='./dictionary.ts' />
/// <reference path='./textureMapGenerator.ts' />
/// <reference path='./clusterMaster.ts' />
module Texturer {

	var fs = require("fs"),
		path = require('path'),
		util = require('util'),
		_startTime = Date.now();

	export class Texturer {
		private _cq : any;
		private _callback : any;
		private _thisArg : any;
		private _configParser : any;
		private _textureMapArray : any;
		private _loadedFilesDictionary : any;
		private _loadedFilesCount : any;
		private _totalFilesCount : any;
		private _totalTexturMapsRequiredCount : any;

		constructor() {
			this._cq = new ClusterQueue.Master({
				file : path.resolve(__dirname, "_tasks.js")
				//, maxSimultaneousTasks : 1
			});
		}

		/**
		 * @param configJSONString
		 * @param {function(this:T) : string|null } callback Returns null if success, or error text in case error occurred
		 * @param {T} thisArg
		 * @template T
		 */
		public generate(configJSONString, callback, thisArg) {
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
		}

		private _loadFiles() {
			this._configParser.getTextureMapConfigArray().forEach(function (textureMapConfig) {
				this._totalFilesCount += textureMapConfig.getFiles().length;
				if (textureMapConfig.getJustCopy()) {
					this._totalTexturMapsRequiredCount += textureMapConfig.getFiles().length;
				} else {
					this._totalTexturMapsRequiredCount++;
				}
			}, this);

			this._configParser.getTextureMapConfigArray().forEach(this._loadFilesForTextureMap, this);
		}

		private _loadFilesForTextureMap(textureMapConfig : TextureMapConfig) {
			textureMapConfig.getFiles().forEach(function (file) {
				//console.log(path.join(this._configParser.getFolderRootFrom(), file));
				helper.readImageFile(path.join(this._configParser.getFolderRootFrom(), file), function (error, instance) {
					if (error) {
						this._shutdown(error);
					} else {
						var loadedDataDictionary : Dictionary = new Dictionary(),
							trim = {left : 0, right : 0, top : 0, bottom : 0},
							realWidth = instance.width,
							realHeight = instance.height;

						// trim image if it is part of sprite
						if (!textureMapConfig.getJustCopy() && !textureMapConfig.getCompressionOptions()["disable-trim"]) {
							var trimResult = helper.trimImage(instance);

							// new trimmed png instance and trim parameters
							instance = trimResult.png;
							trim = trimResult.trim;
						}
						loadedDataDictionary.setValue("opaque", helper.isOpaque(instance));
						loadedDataDictionary.setValue("realWidth", realWidth);
						loadedDataDictionary.setValue("realHeight", realHeight);
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
		}

		private _generateTextureMaps() {
			this._configParser.getTextureMapConfigArray().forEach(this._generateTextureMap, this);
		}

		private _generateTextureMap(textureMapConfig) {
			if (textureMapConfig.getJustCopy()) {
				textureMapConfig.getFiles().forEach(function (file) {
					var fromFile = path.join(this._configParser.getFolderRootFrom(), file),
						toFile = path.join(this._configParser.getFolderRootToImagesServer(), file),
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
					this._cq.runTask("copyFile", {source : fromFile, target : toFile}, function (error) {
						if (error) {
							_this._shutdown(new Error("" +
								"COPY: \n" +
								"src: " + fromFile + "\n" +
								"dst: " + toFile + "\n" +
								"error: " + error
							));
						}

						var textureMapDictionary : Dictionary = new Dictionary(),
							width = loadedFileDictionary.getValue("width"),
							height = loadedFileDictionary.getValue("height"),
							base64 = "data:image/png;base64," + fs.readFileSync(fromFile).toString('base64');

						textureMapDictionary.setValue("width", width);
						textureMapDictionary.setValue("height", height);
						textureMapDictionary.setValue("area", width * height);
						textureMapDictionary.setValue("repeat-x", false);
						textureMapDictionary.setValue("repeat-y", false);
						textureMapDictionary.setValue("base64", textureMapConfig.encodeDataURI() && base64.length < 32 * 1024 - 256 ? base64 : null);
						//textureMapDictionary.setValue("base64", null);
						textureMapDictionary.setValue("file", file);

						textureMapDictionary.addValue("textures", {
							id         : file,
							x          : 0,
							y          : 0,
							width      : width,
							height     : height,
							realWidth  : loadedFileDictionary.getValue("realWidth"),
							realHeight : loadedFileDictionary.getValue("realHeight"),
							bitmap     : loadedFileDictionary.getValue("bitmap"),
							trim       : loadedFileDictionary.getValue("trim"),
							opaque     : loadedFileDictionary.getValue("opaque")
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

				var textureMapGenerator : TextureMapGenerator = new TextureMapGenerator(this._cq);
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
		}

		/**
		 * @param textureMapConfig
		 * @param {Dictionary} textureMapDictionary
		 */
		private _compressTextureMapImage(textureMapConfig, textureMapDictionary) {
			console.log(textureMapConfig.getPNGFileName() + ": w = " + textureMapDictionary.getValue("width") + ", h = " + textureMapDictionary.getValue("height") + ", area = " + textureMapDictionary.getValue("area"));

			var textureArray = [];
			textureMapDictionary.getValue("textures").forEach(function (texture : any) {
				var loadedFileDictionary = this._loadedFilesDictionary.getValue(texture.id);
				textureArray.push({
					x                : texture.x,
					y                : texture.y,
					width            : texture.width,
					height           : texture.height,
					realWidth        : loadedFileDictionary.getValue("realWidth"),
					realHeight       : loadedFileDictionary.getValue("realHeight"),
					bitmapSerialized : loadedFileDictionary.getValue("bitmap")//texture.data.png.data
				});
			}, this);

			var bestCompressedImage : Buffer = null,
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

				this._cq.runTask("compressPNG", data, function (error, result : any) {
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
		}

		/**
		 * @param textureMapConfig
		 * @param {Dictionary} textureMapDictionary
		 * @param compressedImage
		 */
		private _onTextureMapImageCompressed(textureMapConfig, textureMapDictionary, compressedImage) {
			var base64 = "data:image/png;base64," + compressedImage.toString('base64');

			textureMapDictionary.setValue("base64", textureMapConfig.encodeDataURI() && base64.length < 32 * 1024 - 256 ? base64 : null);
			textureMapDictionary.setValue("file", textureMapConfig.getPNGFileName());

			// write png
			var file = path.join(this._configParser.getFolderRootToImagesServer(), textureMapConfig.getPNGFileName()),
				data = {
					file    : file,
					content : Array.prototype.slice.call(compressedImage, 0),
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
		}

		private _onTextureMapGenerated() {
			if (this._textureMapArray.length === this._totalTexturMapsRequiredCount) {
				logMemory('build time: ' + (Date.now() - _startTime) + ' ms');
				var duplicateFileNamesArray = helper.writeTexturePoolFile(this._configParser, this._loadedFilesDictionary, this._textureMapArray);
				this._shutdown(duplicateFileNamesArray.length > 0 ? new Error("Found duplicate file names:\n" + duplicateFileNamesArray.join("\n")) : null);
			}
		}

		private _shutdown(error) {
			if (error) {
				this._cq.abort();
				this._callback.call(this._thisArg, error);
			} else {
				this._cq.shutdown(function () {
					this._callback.call(this._thisArg, null);
				}, this);
			}
		}
	}

	var __logMemoryUsage = process.memoryUsage();

	function logMemory(title) {
		console.log(title + "\nheapUsed: " + (process.memoryUsage().heapUsed - __logMemoryUsage.heapUsed + ", heapTotal: " + process.memoryUsage().heapTotal));
	}

}

module.exports = Texturer;
