///<reference path="../shared/multitask/types.ts"/>
///<reference path="../shared/multitask/worker.ts"/>

///<reference path="tinypng.ts"/>

class TinyPngWorker extends MultiTask.Worker {

	protected _onData(data : any) : void {
		//console.log("tinypng.com task...");
		Texturer.TinyPngService.requestFile(data.configFile, new Buffer(data.content), (error, data) => {
			if (!error) {
				this._sendData(data);
			} else {
				this._sendError(error);
			}
		});
	}
}

new TinyPngWorker();
