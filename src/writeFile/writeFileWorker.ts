///<reference path="../shared/multitask/types.ts"/>
///<reference path="../shared/multitask/worker.ts"/>
///<reference path="../shared/utils/fsHelper.ts"/>

var path = require("path"),
	fs   = require("fs");

class WriteFileWorker extends MultiTask.Worker {

	protected _onData(data : any) : void {
		Texturer.Utils.FSHelper.createDirectory(path.dirname(data.file));

		if (fs.existsSync(data.file)) {
			// remove read-only and other attributes and delete file
			fs.chmodSync(data.file, '0777');
			fs.unlinkSync(data.file);
		}

		let content = new Buffer(data.content);
		fs.writeFileSync(data.file, content);

		//var t = null;
		//console.log(t());

		this._sendData(null);
	}
}

new WriteFileWorker();
