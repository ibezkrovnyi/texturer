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
var pngEngine = require("../../custom_modules/node-png").PNG;
var CompressImageWorker = (function (_super) {
    __extends(CompressImageWorker, _super);
    function CompressImageWorker() {
        _super.apply(this, arguments);
    }
    CompressImageWorker.prototype._onData = function (taskData) {
        // TODO: make these options via CompressionOptions class and remove usage of helper.extend, also remove extend at all
        var _this = this;
        var extend = function (origin, add) {
            if (!add || typeof add !== 'object')
                return origin;
            for (var _i = 0, _a = Object.keys(add); _i < _a.length; _i++) {
                var key = _a[_i];
                origin[key] = add[key];
            }
            return origin;
        };
        var options = extend(extend({}, taskData.options), {
            filterType: taskData.filterType,
            width: taskData.width,
            height: taskData.height,
            fill: true
        });
        var png = new pngEngine(options);
        taskData.textureArray.forEach(function (texture) {
            var texturePng = new pngEngine({
                width: texture.width,
                height: texture.height,
                fill: true
            });
            texturePng.data = new Buffer(texture.bitmapSerialized);
            texturePng.bitblt(png, 0, 0, texture.width, texture.height, texture.x, texture.y);
        });
        var stream = png.pack(), chunks = [];
        stream.on("data", function (chunk) {
            chunks.push(chunk);
        });
        stream.on("end", function () {
            _this._sendData({ compressedPNG: Array.prototype.slice.call(Buffer.concat(chunks), 0), filterType: options.filterType });
        });
    };
    return CompressImageWorker;
})(MultiTask.Worker);
new CompressImageWorker();
//# sourceMappingURL=compressImageWorker.js.map