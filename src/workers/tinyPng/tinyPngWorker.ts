import { TinyPngService } from './tinypng';

export function tinyPngWorker(data: any, callback: any) {
  TinyPngService.requestFile(
    data.configFile,
    Buffer.from(data.content),
    (error: any, data: any) => {
      if (!error) {
        callback(undefined, data);
      } else {
        callback(error);
      }
    },
  );
}
