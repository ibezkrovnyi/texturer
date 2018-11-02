import * as fs from 'fs';

export function copyFileWorker(data: any, callback: any) {
  const source = data.source;
  const target = data.target;
  let finished = false;

  const done = (err?: Error) => {
    if (!finished) {
      if (err) {
        callback(err);
      } else {
        callback();
      }
      finished = true;
    }
  };

  const rd = fs.createReadStream(source);
  rd.on('error', done);

  const wr = fs.createWriteStream(target);
  wr.on('error', done);
  wr.on('close', function() {
    // restore original file's modified date/time
    const stat = fs.statSync(source);
    fs.utimesSync(target, stat.atime, stat.mtime);

    // done
    done();
  });
  rd.pipe(wr);
}
