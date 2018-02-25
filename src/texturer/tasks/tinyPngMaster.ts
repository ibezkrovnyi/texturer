import { MultiTaskMasterTask } from '../../shared/multitask/types';

export class TinyPngMaster implements MultiTaskMasterTask {
  private _data: any;
  private _callback: (error: string, data: any) => void;

  constructor(data: any, callback: (error: string | null, data: any) => void) {
    this._data = data;
    this._callback = callback;
  }

  getFile(): string {
    return 'tinyPng/tinyPngWorker.js';
  }

  getWorkerData(): Object {
    return this._data;
  }

  onData(error: string, data: any): void {
    this._callback(error, data);
  }
}
