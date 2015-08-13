///<reference path="../shared/multitask/types.ts"/>
///<reference path="../shared/multitask/worker.ts"/>

var fs = require("fs");

class CopyFileWorker extends MultiTask.Worker {

	protected _onData(data : any) : void {
		let source   = data.source,
			target   = data.target,
			finished = false;

		var done = (err? : Error) => {
			if (!finished) {
				if (err) {
					this._sendError(err);
				} else {
					this._sendData(null);
				}
				finished = true;
			}
		};

		let rd = fs.createReadStream(source);
		rd.on("error", done);

		let wr = fs.createWriteStream(target);
		wr.on("error", done);
		wr.on("close", function () {
			// restore original file's modified date/time
			let stat = fs.statSync(source);
			fs.utimesSync(target, stat.atime, stat.mtime);

			// done
			done();
		});
		rd.pipe(wr);
	}
}

new CopyFileWorker();
