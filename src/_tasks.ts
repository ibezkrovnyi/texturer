/// <reference path='./helper.ts' />
/// <reference path='./binPackerAlgorithm.ts' />
/// <reference path='./dictionary.ts' />
/// <reference path='./tinypng.ts' />
/// <reference path='./clusterWorker.ts' />
module Texturer {
	/*
	 * Project: Texturer
	 *
	 * User: Igor Bezkrovny
	 * Date: 18.10.2014
	 * Time: 19:36
	 * MIT LICENSE
	 */

	var pngEngine = require("./modules/node-png/lib/png").PNG,
		path = require("path"),
		fs = require("fs");

	ClusterQueue.registerTask("binPacker", function (taskData) {
		var best : any = null;
		for (var x = taskData.fromX; x <= taskData.toX; x += 16) {
			for (var y = taskData.fromY; y <= taskData.toY; y += 16) {
				if (taskData.totalPixels <= x * y) {
					var map = tryToPack(taskData.files, x, y, taskData.gridStep);
					if (map && (best === null || best.getValue("area") > map.getValue("area"))) {
						best = map;
					}
				}
			}
		}

		// send processed taskData back to cluster
		if (best) {
			ClusterQueue.send(null, best.getSerialized());
		} else {
			ClusterQueue.send(null, null);
		}
	}, null);

	ClusterQueue.registerTask("writeFile", function (taskData) {
		try {
			helper.createDirectory(path.dirname(taskData.file));
			// check if file exists
			if (fs.existsSync(taskData.file)) {
				// remove read-only and other attributes
				fs.chmodSync(taskData.file, '0777');

				// delete file
				fs.unlinkSync(taskData.file);
			}

			var data = new Buffer(taskData.content);
			if (taskData.tinypng.enabled) {
				console.log("tinypng.com task...");
				TinyPng.requestFile(taskData.tinypng.configFile, data, function (error, data) {
					if (!error) {
						fs.writeFileSync(taskData.file, data);
					}
					ClusterQueue.send(error, null);
				}, null)
			} else {
				fs.writeFileSync(taskData.file, data);
				ClusterQueue.send(null, null);
			}
		} catch (e) {
			ClusterQueue.send("worker 'writeFile': file=" + taskData.file + ", " + e.toString() + "\nstack: " + (e.stack), null);
		}
	}, null);

	ClusterQueue.registerTask("compressPNG", function (taskData) {
		var options = helper.extend(taskData.options, {
			filterType : taskData.filterType,
			width      : taskData.width,
			height     : taskData.height,
			fill       : true
		});

		var png = new pngEngine(options);
		taskData.textureArray.forEach(function (texture) {
			var texturePng = new pngEngine({
				width  : texture.width,
				height : texture.height,
				fill   : true
			});

			texturePng.data = new Buffer(texture.bitmapSerialized);//bitmap.getRGBABuffer();
			texturePng.bitblt(png, 0, 0, texture.width, texture.height, texture.x, texture.y);
		});

		var stream = png.pack(),
			chunks = [];

		stream.on("data", function (chunk) {
			chunks.push(chunk);
		});

		stream.on("end", function () {
			ClusterQueue.send(null, {compressedPNG : Array.prototype.slice.call(Buffer.concat(chunks), 0), filterType : options.filterType});
		});
	}, null);

	ClusterQueue.registerTask("copyFile", function (taskData) {
		var source = taskData.source,
			target = taskData.target,
			finished = false;

		function done(err?) {
			if (!finished) {
				ClusterQueue.send(!!err ? err : null, null);
				finished = true;
			}
		}

		var rd = fs.createReadStream(source);
		rd.on("error", done);

		var wr = fs.createWriteStream(target);
		wr.on("error", done);
		wr.on("close", function (ex) {
			// restore original file's modified date/time
			var stat = fs.statSync(source);
			fs.utimesSync(target, stat.atime, stat.mtime);

			// done
			done();
		});
		rd.pipe(wr);
	}, null);

	/**
	 * @param {{id : string, width : number, height : number}[]} imageInfoArray
	 * @param {number} spriteWidth
	 * @param {number} spriteHeight
	 * @returns {Dictionary}
	 */
	function tryToPack(imageInfoArray, spriteWidth, spriteHeight, gridStep) {
		var packer : BinPacker = new BinPacker(spriteWidth, spriteHeight, gridStep),
			textureMap : Dictionary = new Dictionary(),
			textures = [],
			width = 0,
			height = 0;

		for (var i = 0; i < imageInfoArray.length; i++) {
			var imageInfo = imageInfoArray[i],
				w = imageInfo.width,
				h = imageInfo.height,
				placeCoordinates = packer.placeNextRectangle(w, h);

			if (placeCoordinates !== null) {
				textureMap.addValue("textures", {
					id     : imageInfo.id,
					x      : placeCoordinates.x,
					y      : placeCoordinates.y,
					width  : imageInfo.width,
					height : imageInfo.height
				});

				width = Math.max(width, placeCoordinates.x + imageInfo.width);
				height = Math.max(height, placeCoordinates.y + imageInfo.height);

			} else {
				textureMap = null;
				break;
			}
		}

		if (textureMap) {
			textureMap.setValue("width", width);
			textureMap.setValue("height", height);
			textureMap.setValue("area", width * height);
		}

		return textureMap;
	}

}
