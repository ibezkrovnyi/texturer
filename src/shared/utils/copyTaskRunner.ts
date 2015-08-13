///<reference path="../containers/textureMap.ts"/>
///<reference path="../node.d.ts"/>
///<reference path="../config/globalConfig.ts"/>
///<reference path="../multitask/master.ts"/>
///<reference path="../containers/loadedFile.ts"/>
///<reference path="dataURIEncoder.ts"/>
///<reference path="../../texturer/tasks/copyFileMaster.ts"/>
namespace Texturer.Utils {

	var path = require("path"),
		fs   = require("fs");

	export class CopyTaskRunner {
		private _globalConfig : Config.GlobalConfig;
		private _copyTask : Config.CopyTask;
		private _loadedFiles : { [fileName : string] : Containers.LoadedFile };
		private _clusterQueue : MultiTask.Master;
		private _callback : (error, result) => void;
		private _textureMaps : Containers.TextureMap[];

		constructor(globalConfig : Config.GlobalConfig, copyTask : Config.CopyTask, loadedFiles : { [fileName : string] : Containers.LoadedFile }, clusterQueue : MultiTask.Master, callback : (error, result) => void) {
			this._globalConfig = globalConfig;
			this._copyTask     = copyTask;
			this._loadedFiles  = loadedFiles;
			this._clusterQueue = clusterQueue;
			this._textureMaps  = [];
			this._callback     = callback;
		}

		run() : void {
			this._copyTask.files.forEach((file : string) => {
				var fromFile                           = path.join(this._globalConfig.getFolderRootFrom(), file),
					toFile                             = path.join(this._globalConfig.getFolderRootToIndexHtml(), file),
					loadedFile : Containers.LoadedFile = this._loadedFiles[ file ];

				// dataURI
				let dataURI : string = null;
				if (this._copyTask.dataURI.enable) {
					dataURI = new Utils.DataURIEncoder().encodeFile(fromFile);
					if (dataURI.length >= this._copyTask.dataURI.maxSize) {
						dataURI = null;
					}
				}

				var width  = loadedFile.getWidth(),
					height = loadedFile.getHeight();

				let textureImage = new Containers.TextureImage();
				textureImage.setData(loadedFile.getRealWidth(), loadedFile.getRealHeight(), loadedFile.getBitmap(), loadedFile.getTrim(), loadedFile.isOpaque());

				let texture = new Containers.Texture();
				texture.setData(0, 0, width, height);
				texture.setTextureImage(textureImage);

				let textureMap : Containers.TextureMap = new Containers.TextureMap();
				textureMap.setData(file, width, height, false, false);
				textureMap.setDataURI(dataURI);
				textureMap.setTexture(file, texture);

				const skipFileWrite = dataURI && !this._copyTask.dataURI.createImageFileAnyway;
				if (!skipFileWrite) {
					// fs.link(fromFile, toFile, function (error) {
					this._copyFile(fromFile, toFile, () => {
						this._addTextureMap(textureMap);
					});
				} else {
					this._addTextureMap(textureMap);
				}
			});
		}

		private _copyFile(fromFile : string, toFile : string, onCopyFinishedCallback : () => void) : void {
			try {
				Utils.FSHelper.createDirectory(path.dirname(toFile));

				// check if file exists
				if (fs.existsSync(toFile)) {
					// remove read-only and other attributes
					fs.chmodSync(toFile, '0777');

					// delete file
					fs.unlinkSync(toFile);
				}
			} catch (e) {
				this._callback(new Error("COPY PREPARATION: " + e.toString()), null);
			}

			var copyTask = new CopyFileMaster({ source : fromFile, target : toFile }, error => {
				if (error) {
					this._callback(new Error("" +
						"COPY: \n" +
						"src: " + fromFile + "\n" +
						"dst: " + toFile + "\n" +
						"error: " + error
					), null);
				}

				onCopyFinishedCallback();
			});

			this._clusterQueue.runTask(copyTask);
		}

		private _addTextureMap(textureMapImage : Containers.TextureMap) : void {
			this._textureMaps.push(textureMapImage);

			if (this._copyTask.files.length === this._textureMaps.length) {
				this._callback(null, this._textureMaps);
			}
		}
	}
}
