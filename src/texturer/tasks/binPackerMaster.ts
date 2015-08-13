///<reference path="../../shared/containers/binPackerResult.ts"/>
///<reference path="../../shared/multitask/types.ts"/>
///<reference path="../../shared/config/tasks/textureMapTask.ts"/>
///<reference path="../../shared/containers/textureMap.ts"/>
namespace Texturer {

	export class BinPackerMaster implements MultiTask.MasterTask {
		private _data;
		private _textureMapTask : Config.TextureMapTask;
		private _callback : (textureMap : Containers.TextureMap) => void;

		constructor(textureMapTask : Config.TextureMapTask, files : Containers.FileDimensions[], targetRectangle : Containers.Rect, totalPixels : number, callback : (textureMap : Containers.TextureMap) => void) {
			this._textureMapTask = textureMapTask;
			this._callback       = callback;
			this._data           = {
				fromX       : targetRectangle.left,
				toX         : targetRectangle.right,
				fromY       : targetRectangle.top,
				toY         : targetRectangle.bottom,
				totalPixels : totalPixels,
				files       : files,
				gridStep    : textureMapTask.gridStep,
				paddingX    : textureMapTask.paddingX,
				paddingY    : textureMapTask.paddingY
			};
		}

		getFile() : string {
			return 'binPackerWorker.js';
		}

		getWorkerData() : Object {
			return this._data;
		}

		onData(error : string, data : Containers.BinPackerResult) : void {
			if (error) {
				throw new Error(error);
			} else {
				if (!data) {
					// TODO: it is not good to call callback with null, think about convert it to specific Error
					this._callback(null);
				} else {
					const width      = data.width,
						  height     = data.height,
						  textureIds = Object.keys(data.rectangles);

					let textureMap = new Containers.TextureMap();
					textureMap.setData(this._textureMapTask.textureMapFileName, width, height, this._textureMapTask.repeatX, this._textureMapTask.repeatY);
					for (const id of textureIds) {
						let texture          = new Containers.Texture(),
							textureContainer = data.rectangles[ id ];
						// TODO: why next line in red??
						texture.setData(textureContainer.x, textureContainer.y, textureContainer.width, textureContainer.height);
						textureMap.setTexture(id, texture);
					}

					this._callback(textureMap);
				}
			}
		}
	}
}
