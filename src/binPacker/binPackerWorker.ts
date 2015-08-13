///<reference path="../shared/multitask/types.ts"/>
///<reference path="../shared/multitask/worker.ts"/>
///<reference path="../shared/containers/binPackerResult.ts"/>
///<reference path="../shared/containers/textureMap.ts"/>

///<reference path="binPackerAlgorithm.ts"/>

class BinPackerWorker extends MultiTask.Worker {

	// there is no sense to try all possible width/height. width/height step = 16 is ok
	private static _binPackerSizeStep = 16;

	protected _onData(data : any) : void {
		let best : Texturer.Containers.BinPackerResult = null;
		for (let x = data.fromX; x <= data.toX; x += BinPackerWorker._binPackerSizeStep) {
			for (let y = data.fromY; y <= data.toY; y += BinPackerWorker._binPackerSizeStep) {

				if (data.totalPixels <= x * y) {
					let binPackerResult = this._tryToPack(data.files, x, y, data.gridStep, data.paddingX, data.paddingY);
					if (binPackerResult) {
						if (!best || best.width * best.height > binPackerResult.width * binPackerResult.height) {
							best = binPackerResult;
						}

						// we found binPackerResult for 'x', 'y' => for 'x', 'y + 1' result will be the same, so go to next 'x'
						break;
					}
				}

			}
		}

		// send processed taskData back to cluster
		this._sendData(best);
	}

	private _tryToPack(fileDimensions : Texturer.Containers.FileDimensions[], spriteWidth : number, spriteHeight : number, gridStep : number, paddingX : number, paddingY : number) : Texturer.Containers.BinPackerResult {
		let packer : Texturer.BinPacker                              = new Texturer.BinPacker(spriteWidth, spriteHeight, gridStep, paddingX, paddingY),
			rectangles : Texturer.Containers.BinRectanglesDictionary = {},
			width                                                    = 0,
			height                                                   = 0;

		for (const fileDimension of fileDimensions) {
			const placeCoordinates = packer.placeNextRectangle(fileDimension.width, fileDimension.height);
			if (placeCoordinates !== null) {
				rectangles[ fileDimension.id ] = {
					x      : placeCoordinates.x,
					y      : placeCoordinates.y,
					width  : fileDimension.width,
					height : fileDimension.height
				};

				width  = Math.max(width, placeCoordinates.x + fileDimension.width);
				height = Math.max(height, placeCoordinates.y + fileDimension.height);
			} else {
				return null;
			}
		}

		return { width, height, rectangles };
	}
}

new BinPackerWorker();
