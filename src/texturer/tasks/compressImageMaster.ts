///<reference path="../../shared/multitask/types.ts"/>
namespace Texturer {

	export class CompressImageMaster implements MultiTask.MasterTask {
		private _data;
		private _callback : (error : string, data : any) => void;

		constructor(data : any, callback : (error : string, data : any) => void) {
			this._data     = data;
			this._callback = callback;
		}

		getFile() : string {
			return 'compressImageWorker.js';
		}

		getWorkerData() : Object {
			return this._data;
		}

		onData(error : string, data : any) : void {
			this._callback(error, data);
		}
	}
}
