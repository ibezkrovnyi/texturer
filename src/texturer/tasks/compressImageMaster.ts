import { MultiTaskMasterTask } from '../../shared/multitask/types';

export class CompressImageMaster implements MultiTaskMasterTask {
  private _data: any;
  private _callback: (error: string, data: any) => void;

  constructor(data: any, callback: (error: string, data: any) => void) {
    this._data = data;
    this._callback = callback;
  }

  getFile(): string {
    return 'compressImage/compressImageWorker.js';
  }

  getWorkerData(): Object {
    return this._data;
  }

  onData(error: string, data: any): void {
    this._callback(error, data);
  }
}
