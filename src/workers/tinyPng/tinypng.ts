import * as fs from 'fs';
import * as https from 'https';
import * as url from 'url';
import { parse } from 'jsonc-parser';

export class TinyPngService {

  static requestFile(configFile: string, postData: any, callback: any) {
    const requestOptions: https.RequestOptions = url.parse('https://api.tinypng.com/shrink');
    requestOptions.auth = 'api:' + TinyPngService._getBestKey(configFile);
    requestOptions.method = 'POST';

    const req = https.request(requestOptions, function (res: any) {
      if (res.statusCode === 201) {
        TinyPngService._getFile(res.headers.location, callback);
      } else {
        if (callback) {
          callback(new Error(`tinyPng service: status = ${res.statusCode}, error = ${res.statusMessage}`), null);
          callback = null;
        }
      }
      res.on('data', function () {
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

  private static _getBestKey(configFile: string): string {
    const data = parse(fs.readFileSync(configFile, 'utf8'));
    const curDate = new Date();
    const curYear = curDate.getFullYear();
    const curMonth = curDate.getMonth() + 1;

    let best: any = null;
    data[ 'tinypng-api-keys' ].forEach(function (keyData: any) {
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
    fs.writeFileSync(configFile, JSON.stringify(data, null, '\t'));
    return best.key;
  }

  private static _getFile(url: string, callback: any) {
    https.get(url, function (res: any) {
      const chunks: any[] = [];
      res.on('data', function (chunk: any) {
        chunks.push(chunk);
      });

      res.on('end', function () {
        if (callback) {
          callback(null, Buffer.concat(chunks));
          callback = null;
        }
      });

      res.on('error', function (e: Error) {
        if (callback) {
          callback(e, null);
          callback = null;
        }
      });
    });
  }
}
