let fs = require("fs"),
  https = require("https"),
  url = require("url");

export class TinyPngService {

  static requestFile(configFile: string, postData: any, callback: any): void {
    let req_options = url.parse("https://api.tinypng.com/shrink");
    req_options.auth = "api:" + TinyPngService._getBestKey(configFile);
    req_options.method = "POST";

    let req = https.request(req_options, function (res: any) {
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
      res.on('data', function (chunk: any) {
        //console.log('BODY: ' + chunk);
      });
    });

    req.on('error', function (e: Error) {
      if (callback) {
        callback(e, null);
        callback = null;
      }
    });

    // write data to request body
    req.write(postData);
    req.end();
  }

  private static _getBestKey(configFile: string): string {
    let data = eval("(" + fs.readFileSync(configFile, 'utf8') + ")");

    let curDate = new Date(),
      curYear = curDate.getFullYear(),
      curMonth = curDate.getMonth() + 1,
      best: any = null;

    data[ "tinypng-api-keys" ].forEach(function (keyData: any) {
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

  private static _getFile(url: string, callback: any): void {
    https.get(url, function (res: any) {
      let chunks: any[] = [];
      res.on("data", function (chunk: any) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        if (callback) {
          callback(null, Buffer.concat(chunks));
          callback = null;
        }
      });

      res.on("error", function (e: Error) {
        if (callback) {
          callback(e, null);
          callback = null;
        }
      });
    });
  }
}
