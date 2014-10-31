/*
 * Project: textureMapGenerator
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */

var BinPacker  = require('./../binPacker/binPackerAlgorithm.js'),
	Dictionary = require("./../dictionary.js"),
	pngEngine  = require("./../modules/node-png/lib/png").PNG,
	tinypng = require('../tinypng/tinypng.js'),
	helper     = require("./../helper.js"),
	path       = require("path"),
	fs         = require("fs"),
	cq         = require("./../modules/clusterQueue/clusterQueue.js");

cq.registerTask("binPacker", function (taskData) {
	var best = null;
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
		cq.send(null, best.getSerialized());
	} else {
		cq.send(null, null);
	}
}, null);

cq.registerTask("writeFile", function (taskData) {
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
		if(taskData.tinypng.enabled) {
			console.log("tinypng.com task...");
			tinypng.compress(taskData.tinypng.configFile, data, function(error, data) {
				if(!error) {
					fs.writeFileSync(taskData.file, data);
				}
				cq.send(error, null);
			}, null)
		} else {
			fs.writeFileSync(taskData.file, data);
			cq.send(null, null);
		}
	} catch (e) {
		cq.send("worker 'writeFile': file=" + taskData.file + ", " + e.toString() + "\nstack: " + (e.stack), null);
	}
}, null);

cq.registerTask("compressPNG", function (taskData) {
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
		cq.send(null, {compressedPNG : Buffer.concat(chunks), filterType : options.filterType});
	});
}, null);

/**
 * @param {{id : string, width : number, height : number}[]} imageInfoArray
 * @param {number} spriteWidth
 * @param {number} spriteHeight
 * @returns {Dictionary}
 */
function tryToPack (imageInfoArray, spriteWidth, spriteHeight, gridStep) {
	var packer = new BinPacker(spriteWidth, spriteHeight, gridStep),
		textureMap = new Dictionary(),
		textures = [],
		width = 0,
		height = 0;

	for (var i = 0; i < imageInfoArray.length; i++) {
		var imageInfo = imageInfoArray[i],
			w = imageInfo.width,
			h = imageInfo.height,
			placeCoordinates = packer.placeNextRectangle(w, h);

		if (placeCoordinates !== null) {
			/*
						var texture = new Dictionary();
						texture.setValue("id", imageInfo.id);
						texture.setValue("x", placeCoordinates.x);
						texture.setValue("y", placeCoordinates.y);
						texture.setValue("width", imageInfo.width);
						texture.setValue("height", imageInfo.height);

						width = Math.max(width, placeCoordinates.x + imageInfo.width);
						height = Math.max(height, placeCoordinates.y + imageInfo.height);

						textureMap.addValue("textures", texture);
			*/
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
		/*
				if (packer.getRealDimensions().width !== textureMap.getWidth()) {
					throw 'error w: ' + packer.getRealDimensions().width + ',' + textureMap.getWidth();
				} else if (packer.getRealDimensions().height !== textureMap.getHeight()) {
					throw 'error h: ' + packer.getRealDimensions().height + ',' + textureMap.getHeight();
				}
		*/
	}

	return textureMap;
}
