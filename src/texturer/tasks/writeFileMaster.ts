import { MultiTaskMasterTask } from '../../shared/multitask/types';

export class WriteFileMaster implements MultiTaskMasterTask {
  private _data: Object;
  private _callback: (error: string, data: any) => void;

  constructor(data: any, callback: (error: string, data: any) => void) {
    this._data = data;
    this._callback = callback;
  }

  getFile(): string {
    return 'writeFile/writeFileWorker.js';
  }

  getWorkerData(): Object {
    return this._data;
  }

  onData(error: string, data: any): void {
    this._callback(error, data);
  }
}
