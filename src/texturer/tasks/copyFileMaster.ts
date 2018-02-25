import { MultiTaskMasterTask } from "../../shared/multitask/types";

export class CopyFileMaster implements MultiTaskMasterTask {
  private _data: Object;
  private _callback: (error: string, data: any) => void;

  constructor(data: any, callback: (error: string, data: any) => void) {
    this._data = data;
    this._callback = callback;
  }

  getFile(): string {
    return 'copyFile/copyFileWorker.js';
  }

  getWorkerData(): Object {
    return this._data;
  }

  onData(error: string, data: any): void {
    this._callback(error, data);
  }
}
