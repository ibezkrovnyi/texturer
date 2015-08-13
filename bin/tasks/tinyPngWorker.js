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
var Texturer;
(function (Texturer) {
    var fs = require("fs"), https = require("https"), url = require("url");
    var TinyPngService = (function () {
        function TinyPngService() {
        }
        TinyPngService.requestFile = function (configFile, postData, callback) {
            var req_options = url.parse("https://api.tinypng.com/shrink");
            req_options.auth = "api:" + TinyPngService._getBestKey(configFile);
            req_options.method = "POST";
            var req = https.request(req_options, function (res) {
                if (res.statusCode === 201) {
                    TinyPngService._getFile(res.headers.location, callback);
                }
                else {
                    if (callback) {
                        callback(new Error("tinyPng service: status = " + res.statusCode + ", error = " + res.statusMessage), null);
                        callback = null;
                    }
                }
                res.on('data', function (chunk) {
                });
            });
            req.on('error', function (e) {
                if (callback) {
                    callback(e, null);
                    callback = null;
                }
            });
            req.write(postData);
            req.end();
        };
        TinyPngService._getBestKey = function (configFile) {
            var data = eval("(" + fs.readFileSync(configFile, 'utf8') + ")");
            var curDate = new Date(), curYear = curDate.getFullYear(), curMonth = curDate.getMonth() + 1, best = null;
            data["tinypng-api-keys"].forEach(function (keyData) {
                if (curYear !== keyData.year || curMonth !== keyData.month) {
                    keyData.used = 0;
                    keyData.month = curMonth;
                    keyData.year = curYear;
                }
                if (best === null || keyData.used < best.used) {
                    best = keyData;
                }
            });
            best.used++;
            fs.writeFileSync(configFile, JSON.stringify(data, null, "\t"));
            return best.key;
        };
        TinyPngService._getFile = function (url, callback) {
            https.get(url, function (res) {
                var chunks = [];
                res.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                res.on("end", function () {
                    if (callback) {
                        callback(null, Buffer.concat(chunks));
                        callback = null;
                    }
                });
                res.on("error", function (e) {
                    if (callback) {
                        callback(e, null);
                        callback = null;
                    }
                });
            });
        };
        return TinyPngService;
    })();
    Texturer.TinyPngService = TinyPngService;
})(Texturer || (Texturer = {}));
///<reference path="../shared/multitask/types.ts"/>
///<reference path="../shared/multitask/worker.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
///<reference path="tinypng.ts"/>
var TinyPngWorker = (function (_super) {
    __extends(TinyPngWorker, _super);
    function TinyPngWorker() {
        _super.apply(this, arguments);
    }
    TinyPngWorker.prototype._onData = function (data) {
        var _this = this;
        Texturer.TinyPngService.requestFile(data.configFile, new Buffer(data.content), function (error, data) {
            if (!error) {
                _this._sendData(data);
            }
            else {
                _this._sendError(error);
            }
        });
    };
    return TinyPngWorker;
})(MultiTask.Worker);
new TinyPngWorker();
//# sourceMappingURL=tinyPngWorker.js.map