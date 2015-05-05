/// <reference path='./dictionary.ts' />

/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */

var path       = require("path");
/*
cluster.setupMaster({
	exec : path.resolve(__dirname, "../binPacker", "tasks.js")
});
*/

module Texturer {

	export class TextureMapGenerator {
		private _cq;
		private _plannedPlaceFilesTests : number;
		private _finishedPlaceFilesTests : number;
		private _textureMap;
		private _callback;
		private _thisArg;
		private _totalPixels;

		constructor(cq) {
			this._cq = cq;
		}

		public generateTextureMap (files, textureMapConfig, callback, thisArg) {
			try {
				// calculate total pixels
				var totalPixels = 0;
				files.forEach(function (file) {
					totalPixels += file.width * file.height;
				});

				this._plannedPlaceFilesTests = 3 + textureMapConfig.getNPass();
				this._finishedPlaceFilesTests = 0;
				this._textureMap = null;
				this._callback = callback;
				this._thisArg = thisArg;
				this._totalPixels = totalPixels;

				// try different combinations
				this._placeFiles(textureMapConfig, files.sort(function (a, b) {
					return (b.width * b.height - a.width * a.height) || (b.id > a.id ? 1 : -1);
				}));

				this._placeFiles(textureMapConfig, files.sort(function (a, b) {
					return (b.width - a.width) || (b.id > a.id ? 1 : -1);
				}));

				this._placeFiles(textureMapConfig, files.sort(function (a, b) {
					return (b.height - a.height) || (b.id > a.id ? 1 : -1);
				}));

				for (var i = 0; i < textureMapConfig.getNPass(); i++) {
					this._placeFiles(textureMapConfig, this._getShuffledArray(files));
				}
			} catch (e) {
				callback.call(thisArg, e.stack, null);
			}
		}

		public _onPlaceFilesFinished (error, bestTextureMapDictionary) {
			if (!error && bestTextureMapDictionary) {
				if (this._textureMap === null || bestTextureMapDictionary.getValue("area") < this._textureMap.getValue("area")) {
					this._textureMap = bestTextureMapDictionary;
				}
			}

			this._finishedPlaceFilesTests++;

			//process.stdout.write("placeFilesTests: " + this._finishedPlaceFilesTests + " of " + this._plannedPlaceFilesTests + "\033[0G");

			if (this._finishedPlaceFilesTests === this._plannedPlaceFilesTests) {
				if (this._textureMap && this._textureMap.getValue("area") > 0) {
					this._callback.call(this._thisArg, null, this._textureMap);
				} else {
					this._callback.call(this._thisArg, null, null);
				}
			}
		}

		public _placeFiles (textureMapConfig, files) {
			var targetSpriteWidth = null,
				targetSpriteHeight = null;

			if (textureMapConfig.getRepeatX() && textureMapConfig.getRepeatY()) {
				throw "sprite can't be repeat-x and repeat-y at the same time";
			}

			if (textureMapConfig.getRepeatX()) {
				targetSpriteWidth = files[0].width;
				files.forEach(function (file) {
					if (file.width !== targetSpriteWidth) {
						throw "all images should have the same width to repeat by X axis";
					}
				});
			}

			if (textureMapConfig.getRepeatY()) {
				targetSpriteHeight = files[0].height;
				files.forEach(function (file) {
					if (file.height !== targetSpriteHeight) {
						throw "all images should have the same width to repeat by Y axis";
					}
				});
			}

			var fromX = targetSpriteWidth || 4,
				toX = targetSpriteWidth || 1920,
				fromY = targetSpriteHeight || 4,
				toY = targetSpriteHeight || 1080;

			var data = {
				fromX       : fromX,
				toX         : toX,
				fromY       : fromY,
				toY         : toY,
				totalPixels : this._totalPixels,
				files       : files,
				/*
				 isRepeatX   : textureMapConfig.getRepeatX(),
				 isRepeatY   : textureMapConfig.getRepeatY(),
				 */
				gridStep    : textureMapConfig.getGridStep()
			};

			this._cq.runTask("binPacker", data, function (error, result) {
				if (error) {
					this._onPlaceFilesFinished(error, null);
				} else {
					if (result) {
						var map = new Dictionary(result);
						map.setValue("repeat-x", textureMapConfig.getRepeatX());
						map.setValue("repeat-y", textureMapConfig.getRepeatY());
						/*
						 map.getValue("textures").forEach(function(texture, index, textures) {
						 //textures[index] = new Dictionary(texture);
						 });
						 */
						this._onPlaceFilesFinished(null, map);
					} else {
						this._onPlaceFilesFinished(null, null);
					}
				}
			}, this);
		}

		public _getShuffledArray (arr) {
			var shuffled = arr.slice(0);
			for (var i = 0; i < shuffled.length - 1; i++) {
				var l = shuffled.length;
				var index = ((Math.random() * (l - i)) | 0) + i;

				var tmp = shuffled[index];
				shuffled[index] = shuffled[i];
				shuffled[i] = tmp;
			}

			return shuffled;
		}
	}
}
