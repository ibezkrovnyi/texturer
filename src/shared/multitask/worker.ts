export class MultiTaskWorker {
  constructor() {
    process.on("message", (data: string | Object) => {
      var d = require('domain').create();
      d.on('error', (error: Error) => {
        this._sendError(error);
      });
      d.run(() => {
        this._onData(data);
      });
    });

    process.send!("online");
  }

  protected _onData(data: string | Object): void {

  }

  protected _sendError(error: Error): void {
    const text = error.message + '\n' + (<any>error).stack;
    process.send!({ error: text, data: null });
  }

  protected _sendData(data: string | Object | null): void {
    process.send!({ error: null, data: data });
  }
}
