import { TinyPngService } from './tinypng';

export function tinyPngWorker(data: any, callback: any): void {
    //console.log("tinypng.com task...");
    TinyPngService.requestFile(data.configFile, new Buffer(data.content), (error: any, data: any) => {
      if (!error) {
        callback(undefined, data);
      } else {
        callback(error);
      }
    });
  }

