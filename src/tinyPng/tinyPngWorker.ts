import { MultiTaskWorker } from '../shared/multitask/worker';
import { TinyPngService } from './tinypng';

class TinyPngWorker extends MultiTaskWorker {

  protected _onData(data: any): void {
    //console.log("tinypng.com task...");
    TinyPngService.requestFile(data.configFile, new Buffer(data.content), (error: any, data: any) => {
      if (!error) {
        this._sendData(data);
      } else {
        this._sendError(error);
      }
    });
  }
}

new TinyPngWorker();
