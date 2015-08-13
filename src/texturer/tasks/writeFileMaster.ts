///<reference path="../../shared/multitask/types.ts"/>
namespace Texturer {

	export class WriteFileMaster implements MultiTask.MasterTask {
		private _data;
		private _callback : (error : string, data : any) => void;

		constructor(data : any, callback : (error : string, data : any) => void) {
			this._data     = data;
			this._callback = callback;
		}

		getFile() : string {
			return 'writeFileWorker.js';
		}

		getWorkerData() : Object {
			return this._data;
		}

		onData(error : string, data : any) : void {
			this._callback(error, data);
		}
	}
}
