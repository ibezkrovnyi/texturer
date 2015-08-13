///<reference path="../shared/multitask/types.ts"/>
///<reference path="../shared/multitask/worker.ts"/>

var pngEngine = require("../../extern/node-png").PNG;

class CompressImageWorker extends MultiTask.Worker {

	protected _onData(taskData : any) : void {
		// TODO: make these options via CompressionOptions class and remove usage of helper.extend, also remove extend at all

		var extend = function (origin, add) {
			// Don't do anything if add isn't an object
			if (!add || typeof add !== 'object') return origin;

			for (const key of Object.keys(add)) {
				origin[ key ] = add[ key ];
			}

			return origin;
		};

		let options = extend(extend({}, taskData.options), {
			filterType : taskData.filterType,
			width      : taskData.width,
			height     : taskData.height,
			fill       : true
		});

		let png = new pngEngine(options);
		taskData.textureArray.forEach(function (texture) {
			let texturePng = new pngEngine({
				width  : texture.width,
				height : texture.height,
				fill   : true
			});

			texturePng.data = new Buffer(texture.bitmapSerialized);//bitmap.getRGBABuffer();
			texturePng.bitblt(png, 0, 0, texture.width, texture.height, texture.x, texture.y);
		});

		let stream = png.pack(),
			chunks = [];

		stream.on("data", function (chunk) {
			chunks.push(chunk);
		});

		stream.on("end", () => {
			this._sendData({ compressedPNG : Array.prototype.slice.call(Buffer.concat(chunks), 0), filterType : options.filterType });
		});

	}
}

new CompressImageWorker();
