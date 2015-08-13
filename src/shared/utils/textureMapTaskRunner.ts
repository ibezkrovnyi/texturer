///<reference path="../containers/textureMap.ts"/>
///<reference path="../node.d.ts"/>
///<reference path="../config/globalConfig.ts"/>
///<reference path="../multitask/master.ts"/>
///<reference path="../containers/loadedFile.ts"/>
///<reference path="../../texturer/textureMapGenerator.ts"/>
///<reference path="../../texturer/tasks/compressImageMaster.ts"/>
///<reference path="../../texturer/tasks/tinyPngMaster.ts"/>
///<reference path="dataURIEncoder.ts"/>
///<reference path="../../texturer/tasks/writeFileMaster.ts"/>
namespace Texturer.Utils {

	var path = require("path");

	// TODO: refactor
	export class TextureMapTaskRunner {
		private _textureMapTask : Config.TextureMapTask;
		private _loadedFiles : { [fileName : string] : Containers.LoadedFile };
		private _clusterQueue : MultiTask.Master;
		private _callback : (error, result) => void;
		private _globalConfig : Config.GlobalConfig;

		constructor(globalConfig : Config.GlobalConfig, textureMapTask : Config.TextureMapTask, loadedFiles : { [fileName : string] : Containers.LoadedFile }, clusterQueue : MultiTask.Master, callback : (error, result) => void) {
			this._globalConfig   = globalConfig;
			this._textureMapTask = textureMapTask;
			this._loadedFiles    = loadedFiles;
			this._clusterQueue   = clusterQueue;
			this._callback       = callback;
		}

		run() : void {
			let fileDimensionsArray : Containers.FileDimensions[] = this._textureMapTask.files.map(file => {
				let loadedFile = this._loadedFiles[ file ];
				return new Containers.FileDimensions(file, loadedFile.getWidth(), loadedFile.getHeight());
			});

			let textureMapGenerator : TextureMapGenerator = new TextureMapGenerator(this._clusterQueue);
			textureMapGenerator.generateTextureMap(fileDimensionsArray, this._textureMapTask, (error : string, textureMap : Containers.TextureMap) => {
				if (textureMap) {
					this._compressTextureMapImage(textureMap);
				} else {
					// TODO: do texture map size configurable!!
					this._callback(new Error("Texture Generator: Can't pack texture map for folder '" + this._textureMapTask.folder + "' - too large art. Split images into 2 or more folders!"), null);
				}
			});
		}

		private _compressTextureMapImage(textureMap : Containers.TextureMap) {
			console.log(this._textureMapTask.textureMapFileName + ": w = " + textureMap.getWidth() + ", h = " + textureMap.getHeight() + ", area = " + textureMap.getArea());

			// TODO: what type here?
			var textureArray = [];

			textureMap.getTextureIds().forEach(id => {
				const loadedFile : Containers.LoadedFile = this._loadedFiles[ id ],
					  texture                            = textureMap.getTexture(id);

				textureArray.push({
					x                : texture.getX(),
					y                : texture.getY(),
					width            : texture.getWidth(),
					height           : texture.getHeight(),
					realWidth        : loadedFile.getRealWidth(),
					realHeight       : loadedFile.getRealHeight(),
					bitmapSerialized : loadedFile.getBitmap()
				});
			});

			var bestCompressedImage : Buffer = null,
				filterCount                  = 0,
				filterTypes                  = [ 0, 1, 2, 3, 4 ];

			for (var i = 0; i < filterTypes.length; i++) {

				var data = {
					// TODO: integrate with new compress object properties
					options      : this._textureMapTask.compress,
					filterType   : filterTypes[ i ],
					width        : textureMap.getWidth(),
					height       : textureMap.getHeight(),
					textureArray : textureArray
				};

				this._clusterQueue.runTask(new CompressImageMaster(data, (error, result : any) => {
					if (error) {
						//console.log(`compress ${this._textureMapTask.textureMapFileName}, i = ${filterCount} - finished with error`);
						this._callback(new Error(error), null);
					} else {
						//console.log(`compress ${this._textureMapTask.textureMapFileName}, i = ${filterCount + 1}/${filterTypes.length} - finished OK`);

						// check if better compressed
						var compressedImage = new Buffer(result.compressedPNG);
						if (bestCompressedImage === null || compressedImage.length < bestCompressedImage.length) {
							bestCompressedImage = compressedImage;
						}

						// check if finished
						filterCount++;
						if (filterCount === filterTypes.length) {
							this._onTextureMapImageCompressed(textureMap, bestCompressedImage);
						}
					}
				}));
			}
		}

		private _onTextureMapImageCompressed(textureMapImage : Containers.TextureMap, compressedImage) {
			if (this._textureMapTask.compress.tinyPng) {
				this._clusterQueue.runTask(new TinyPngMaster({
					content    : Array.prototype.slice.call(compressedImage, 0),
					// TODO: create property configFileName
					configFile : "./config.json"
				}, (error, result) => {
					if (error) {
						this._callback(error, null);
						return;
					}

					let compressedImage = new Buffer(result);
					this._createDataURI(textureMapImage, compressedImage);
				}));
			} else {
				this._createDataURI(textureMapImage, compressedImage);
			}
		}

		private _createDataURI(textureMap : Containers.TextureMap, compressedImage : Buffer) : void {
			let dataURI : string = null;
			if (this._textureMapTask.dataURI.enable) {
				dataURI = new Utils.DataURIEncoder().encodeBuffer(compressedImage, "image/png");
				if (dataURI.length >= this._textureMapTask.dataURI.maxSize) {
					dataURI = null;
				}
			}

			textureMap.setDataURI(dataURI);

			const skipFileWrite = dataURI && !this._textureMapTask.dataURI.createImageFileAnyway;
			if (!skipFileWrite) {
				// write png
				var file = path.join(this._globalConfig.getFolderRootToIndexHtml(), this._textureMapTask.textureMapFileName),
					data = {
						file    : file,
						content : Array.prototype.slice.call(compressedImage, 0)
					};

				this._clusterQueue.runTask(new WriteFileMaster(data, (error, result) => {
					if (error) {
						this._callback(error, null);
					} else {
						this._callback(null, textureMap);
					}
				}));
			} else {
				this._callback(null, textureMap);
			}
		}
	}
}
