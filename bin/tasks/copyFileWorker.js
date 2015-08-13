/// <reference path='../node.d.ts' />
///<reference path="../node.d.ts"/>
var MultiTask;
(function (MultiTask) {
    var Worker = (function () {
        function Worker() {
            var _this = this;
            process.on("message", function (data) {
                var d = require('domain').create();
                d.on('error', function (error) {
                    _this._sendError(error);
                });
                d.run(function () {
                    _this._onData(data);
                });
            });
            process.send("online");
        }
        Worker.prototype._onData = function (data) {
        };
        Worker.prototype._sendError = function (error) {
            var text = error.message + '\n' + error.stack;
            process.send({ error: text, data: null });
        };
        Worker.prototype._sendData = function (data) {
            process.send({ error: null, data: data });
        };
        return Worker;
    })();
    MultiTask.Worker = Worker;
})(MultiTask || (MultiTask = {}));
///<reference path="../shared/multitask/types.ts"/>
///<reference path="../shared/multitask/worker.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fs = require("fs");
var CopyFileWorker = (function (_super) {
    __extends(CopyFileWorker, _super);
    function CopyFileWorker() {
        _super.apply(this, arguments);
    }
    CopyFileWorker.prototype._onData = function (data) {
        var _this = this;
        var source = data.source, target = data.target, finished = false;
        var done = function (err) {
            if (!finished) {
                if (err) {
                    _this._sendError(err);
                }
                else {
                    _this._sendData(null);
                }
                finished = true;
            }
        };
        var rd = fs.createReadStream(source);
        rd.on("error", done);
        var wr = fs.createWriteStream(target);
        wr.on("error", done);
        wr.on("close", function () {
            var stat = fs.statSync(source);
            fs.utimesSync(target, stat.atime, stat.mtime);
            done();
        });
        rd.pipe(wr);
    };
    return CopyFileWorker;
})(MultiTask.Worker);
new CopyFileWorker();
//# sourceMappingURL=copyFileWorker.js.map