/// <reference path='../shared/node.d.ts' />
///<reference path="../shared/utils/fsHelper.ts"/>
///<reference path="../shared/config/globalConfig.ts"/>
///<reference path="../shared/utils/texturePoolWriter.ts"/>
/**
 * @preserve
 *
 * Copyright (c) 2014-2015 Igor Bezkrovny
 * @license MIT
 *
 * LICENSE TEXT: {@link https://github.com/igor-bezkrovny/texturer/blob/master/LICENSE}
 */

/// <reference path='../shared/containers/textureMap.ts' />
/// <reference path='../shared/containers/loadedFile.ts' />
///<reference path="../shared/utils/dataURIEncoder.ts"/>
///<reference path="../shared/utils/textureMapTaskRunner.ts"/>

///<reference path="../shared/utils/copyTaskRunner.ts"/>
///<reference path="../shared/utils/imageHelper.ts"/>

///<reference path="../shared/multitask/types.ts"/>
///<reference path="../shared/multitask/master.ts"/>

///<reference path="tasks/binPackerMaster.ts"/>
///<reference path="tasks/compressImageMaster.ts"/>
///<reference path="tasks/writeFileMaster.ts"/>
///<reference path="tasks/copyFileMaster.ts"/>
///<reference path="tasks/tinyPngMaster.ts"/>

/// <reference path='textureMapGenerator.ts' />

namespace Texturer {

	var fs         = require("fs"),
		path       = require('path'),
		util       = require('util'),
		_startTime = Date.now();

	export class Texturer {
		private _cq : MultiTask.Master;
		private _callback : (error? : Error) => void;
		private _configParser : Config.GlobalConfig;
		private _loadedFilesCount : number;
		private _totalFilesCount : number;
		private _totalTexturMapsRequiredCount : any;
		private _loadedFiles : { [fileName : string] : Containers.LoadedFile };
		private _textureMapArray : Containers.TextureMap[];

		constructor() {
			this._cq = new MultiTask.Master(`${__dirname}/tasks`);
			/*
			 this._cq = new ClusterMaster({
			 file : path.resolve(__dirname, "_tasks.js")
			 //, maxSimultaneousTasks : 1
			 });
			 */
		}

		generate(config : Object, callback : (error? : Error) => void) {
			this._cq.restart();

			this._callback = callback;

			try {
				this._configParser    = new Config.GlobalConfig(config);
				this._textureMapArray = [];

				this._loadedFiles = {};

				this._loadedFilesCount             = 0;
				this._totalFilesCount              = 0;
				this._totalTexturMapsRequiredCount = 0;

				this._loadFiles();
			} catch (e) {
				this._shutdown(e);
			}
		}

		private _loadFiles() {
			this._configParser.copyTasks.forEach(copyTask => {
				this._totalFilesCount += copyTask.files.length;
				this._totalTexturMapsRequiredCount += copyTask.files.length;
			});

			this._configParser.textureMapTasks.forEach(textureMapTask => {
				this._totalFilesCount += textureMapTask.files.length;
				this._totalTexturMapsRequiredCount++;
			});

			this._configParser.copyTasks.forEach(copyTask => {
				this._loadFilesForTextureMap(copyTask.files, false, 0);
			});

			this._configParser.textureMapTasks.forEach(textureMapTask => {
				this._loadFilesForTextureMap(textureMapTask.files, textureMapTask.trim.enable, textureMapTask.trim.alpha);
			});
		}

		private _loadFilesForTextureMap(files : string[], doTrim : boolean, alphaThreshold : number) {
			files.forEach(file => {
				Utils.ImageHelper.readImageFile(path.join(this._configParser.getFolderRootFrom(), file), (error, instance) => {
					if (error) {
						this._shutdown(error);
					} else {
						let trim : Containers.Rect = { left : 0, right : 0, top : 0, bottom : 0 },
							realWidth              = instance.width,
							realHeight             = instance.height;

						// trim image if it is part of sprite
						if (doTrim) {
							let trimResult = Utils.ImageHelper.trimImage(instance, alphaThreshold);

							// new trimmed png instance and trim parameters
							instance = trimResult.png;
							trim     = trimResult.trim;
						}
						this._loadedFiles[ file ] = new Containers.LoadedFile(instance.width, instance.height, realWidth, realHeight, Utils.ImageHelper.isOpaque(instance), trim, instance.data);

						this._loadedFilesCount++;
						if (this._totalFilesCount === this._loadedFilesCount) {
							logMemory("files loaded: " + this._totalFilesCount);
							this._generateTextureMaps();
						}
					}
				});
			});
		}

		private _generateTextureMaps() {
			this._configParser.copyTasks.forEach(this._runCopyTask, this);
			this._configParser.textureMapTasks.forEach(this._runTextureMapTask, this);
		}

		private _runCopyTask(copyTask : Config.CopyTask) {
			let runner = new Utils.CopyTaskRunner(this._configParser, copyTask, this._loadedFiles, this._cq, (error, textureMaps : Containers.TextureMap[]) => {
				if (error) {
					this._shutdown(error);
				} else {
					this._onTextureMapGenerated(textureMaps);
				}
			});
			runner.run();
		}

		private _runTextureMapTask(textureMapTask : Config.TextureMapTask) {
			let runner = new Utils.TextureMapTaskRunner(this._configParser, textureMapTask, this._loadedFiles, this._cq, (error, textureMap : Containers.TextureMap) => {
				if (error) {
					this._shutdown(error);
				} else {
					this._onTextureMapGenerated([ textureMap ]);
				}
			});
			runner.run();
		}

		private _onTextureMapGenerated(textureMaps : Containers.TextureMap[]) {
			for (let textureMap of textureMaps) {
				this._textureMapArray.push(textureMap)
			}

			if (this._textureMapArray.length === this._totalTexturMapsRequiredCount) {
				logMemory('build time: ' + (Date.now() - _startTime) + ' ms');
				var duplicateFileNamesArray = new Utils.TexturePoolWriter().writeTexturePoolFile(this._configParser.getFolderRootTo(), this._configParser, this._loadedFiles, this._textureMapArray);
				this._shutdown(duplicateFileNamesArray.length > 0 ? new Error("Found duplicate file names:\n" + duplicateFileNamesArray.join("\n")) : null);
			}
		}

		private _shutdown(error) {
			if (error) {
				this._cq.abort();
				this._callback(error);
			} else {
				this._cq.shutdown(() => {
					this._callback(null);
				})
			}
		}
	}

	var __logMemoryUsage = process.memoryUsage();

	function logMemory(title) {
		console.log(title + "\nheapUsed: " + (process.memoryUsage().heapUsed - __logMemoryUsage.heapUsed + ", heapTotal: " + process.memoryUsage().heapTotal));
	}

}

module.exports = Texturer.Texturer;
