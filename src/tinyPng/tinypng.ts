namespace Texturer {

	let fs = require("fs"),
	https  = require("https"),
	url    = require("url");

	export class TinyPngService {

		static requestFile(configFile, postData, callback) : void {
			let req_options    = url.parse("https://api.tinypng.com/shrink");
			req_options.auth   = "api:" + TinyPngService._getBestKey(configFile);
			req_options.method = "POST";

			let req = https.request(req_options, function (res) {
				if (res.statusCode === 201) {
					TinyPngService._getFile(res.headers.location, callback);
				} else {
					if (callback) {
						callback(new Error(`tinyPng service: status = ${res.statusCode}, error = ${res.statusMessage}`), null);
						callback = null;
					}
				}
				//console.log('STATUS: ' + res.statusCode);
				//console.log('HEADERS: ' + JSON.stringify(res.headers));

				//res.setEncoding('utf8');
				res.on('data', function (chunk) {
					//console.log('BODY: ' + chunk);
				});
			});

			req.on('error', function (e) {
				if (callback) {
					callback(e, null);
					callback = null;
				}
			});

			// write data to request body
			req.write(postData);
			req.end();
		}

		private static _getBestKey(configFile) : string {
			let data = eval("(" + fs.readFileSync(configFile, 'utf8') + ")");

			let curDate    = new Date(),
				curYear    = curDate.getFullYear(),
				curMonth   = curDate.getMonth() + 1,
				best : any = null;

			data[ "tinypng-api-keys" ].forEach(function (keyData : any) {
				// check if month passed
				if (curYear !== keyData.year || curMonth !== keyData.month) {
					keyData.used  = 0;
					keyData.month = curMonth;
					keyData.year  = curYear;
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

		private static _getFile(url, callback) : void {
			https.get(url, function (res) {
				let chunks = [];
				res.on("data", function (chunk) {
					chunks.push(chunk);
				});

				res.on("end", function () {
					if (callback) {
						callback(null, Buffer.concat(chunks));
						callback = null;
					}
				});

				res.on("error", function (e) {
					if (callback) {
						callback(e, null);
						callback = null;
					}
				});
			});
		}
	}
}
