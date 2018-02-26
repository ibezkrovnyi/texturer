import { FSHelper } from '../shared/utils/fsHelper';

var path = require("path"),
  fs = require("fs");

export function writeFileWorker(data: any, callback: any): void {
    FSHelper.createDirectory(path.dirname(data.file));

    if (fs.existsSync(data.file)) {
      // remove read-only and other attributes and delete file
      fs.chmodSync(data.file, '0777');
      fs.unlinkSync(data.file);
    }

    let content = new Buffer(data.content);
    fs.writeFileSync(data.file, content);

    callback();
  }
