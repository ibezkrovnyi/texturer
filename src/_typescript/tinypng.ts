module TinyPng {

	var fs = require("fs"),
		https = require("https"),
		url = require("url");

	function getBestKey(configFile) {
		var data = eval("(" + fs.readFileSync(configFile, 'utf8') + ")");

		var curDate = new Date(),
			curYear = curDate.getFullYear(),
			curMonth = curDate.getMonth() + 1,
			best : any = null;

		data["tinypng-api-keys"].forEach(function (keyData : any) {
			// check if month passed
			if (curYear !== keyData.year || curMonth !== keyData.month) {
				keyData.used = 0;
				keyData.month = curMonth;
				keyData.year = curYear;
			}
			// check for best (less used) key
			if (best === null || keyData.used < best.used) {
				best = keyData;
			}
		});

		best.used++;
		fs.writeFileSync(configFile, JSON.stringify(data, null, "\t"));
		return best.key;
	}

	export function requestFile(configFile, postData, callback, thisArg) {
		var req_options = url.parse("https://api.tinypng.com/shrink");
		req_options.auth = "api:" + getBestKey(configFile);
		req_options.method = "POST";

		var req = https.request(req_options, function (res) {
			if (res.statusCode === 201) {
				getFile(res.headers.location, callback, thisArg);
			} else {
				if (callback) {
					callback.call(thisArg, new Error('tinypng.com: status=' + res.statusCode + ', error=' + res.statusMessage), null);
					callback = null;
					thisArg = null;
				}
			}
			console.log('STATUS: ' + res.statusCode);
			console.log('HEADERS: ' + JSON.stringify(res.headers));

			//res.setEncoding('utf8');
			res.on('data', function (chunk) {
				console.log('BODY: ' + chunk);
			});
		});

		req.on('error', function (e) {
			if (callback) {
				callback.call(thisArg, new Error('tinypng.com: error with request: ' + e.message), null);
				callback = null;
				thisArg = null;
			}
		});

		// write data to request body
		req.write(postData);
		req.end();
	}

	function getFile(url, callback, thisArg) {
		https.get(url, function (res) {
			var chunks = [];
			res.on("data", function (chunk) {
				chunks.push(chunk);
			});

			res.on("end", function () {
				if (callback) {
					callback.call(thisArg, null, Buffer.concat(chunks));
					callback = null;
					thisArg = null;
				}
			});

			res.on("error", function (e) {
				if (callback) {
					callback.call(thisArg, new Error('tinypng.com: error receiving compressed file: ' + e.message), null);
					callback = null;
					thisArg = null;
				}
			});
		});
	}
}
