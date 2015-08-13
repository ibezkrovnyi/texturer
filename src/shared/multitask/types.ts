/// <reference path='../node.d.ts' />
namespace MultiTask {

	export interface MasterTask {
		getFile() : string;
		getWorkerData() : string | Object;
		onData(error : string, data : any) : void;
	}
}
