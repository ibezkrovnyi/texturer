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
///<reference path="../node.d.ts"/>
var Texturer;
(function (Texturer) {
    var Utils;
    (function (Utils) {
        var fs = require("fs"), path = require("path");
        var FSHelper = (function () {
            function FSHelper() {
            }
            FSHelper.getFileNameWithoutExtension = function (fileName) {
                fileName = path.basename(fileName);
                var index = fileName.lastIndexOf('.');
                return (index < 0) ? fileName : fileName.substr(0, index);
            };
            FSHelper.getExtension = function (fileName) {
                var index = fileName.lastIndexOf('.');
                return (index < 0) ? '' : fileName.substr(index + 1);
            };
            FSHelper.createDirectory = function (dir) {
                var folders = path.normalize(dir).replace(/\\/g, "/").split("/");
                if (folders && folders.length > 0) {
                    for (var i = 0; i < folders.length; i++) {
                        var testDir = folders.slice(0, i + 1).join("/");
                        if (!fs.existsSync(testDir)) {
                            fs.mkdirSync(testDir);
                        }
                    }
                }
            };
            FSHelper.checkDirectoryExistsSync = function (dir) {
                if (!fs.existsSync(dir)) {
                    throw new Error("FS: Folder doesn't exist: " + dir);
                }
                else if (!fs.statSync(dir).isDirectory()) {
                    throw new Error("FS: " + dir + " is not a folder");
                }
            };
            FSHelper.getFilesInFolder = function (folder, filter, recursive, subFolder) {
                var fullFolder = typeof subFolder === 'undefined' ? folder : path.join(folder, subFolder), folderFiles = fs.readdirSync(fullFolder), files = [];
                folderFiles.forEach(function (file) {
                    if (filter && filter(file)) {
                        console.log(path.join(fullFolder, file) + " removed by filter");
                        return;
                    }
                    var stat = fs.statSync(path.join(fullFolder, file)), subFolderFileName = typeof subFolder === 'undefined' ? file : path.join(subFolder, file);
                    if (stat.isFile()) {
                        files.push(subFolderFileName);
                    }
                    else if (stat.isDirectory()) {
                        if (recursive) {
                            files = files.concat(FSHelper.getFilesInFolder(folder, filter, recursive, subFolderFileName));
                        }
                    }
                });
                return files.map(function (file) {
                    return file.replace(/\\/g, "/");
                });
            };
            FSHelper.getFoldersInFolder = function (folder, filter, recursive, subFolder) {
                var fullFolder = typeof subFolder === 'undefined' ? folder : path.join(folder, subFolder), folderFiles = fs.readdirSync(fullFolder), folders = [];
                folderFiles.forEach(function (file) {
                    if (filter && filter(file)) {
                        console.log(path.join(fullFolder, file) + " removed by filter");
                        return;
                    }
                    var stat = fs.statSync(path.join(fullFolder, file)), subFolderFileName = typeof subFolder === 'undefined' ? file : path.join(subFolder, file);
                    if (stat.isDirectory()) {
                        folders.push(subFolderFileName);
                        if (recursive) {
                            folders = folders.concat(FSHelper.getFilesInFolder(folder, filter, recursive, subFolderFileName));
                        }
                    }
                });
                return folders.map(function (folder) {
                    return folder.replace(/\\/g, "/");
                });
            };
            return FSHelper;
        })();
        Utils.FSHelper = FSHelper;
    })(Utils = Texturer.Utils || (Texturer.Utils = {}));
})(Texturer || (Texturer = {}));
///<reference path="../shared/multitask/types.ts"/>
///<reference path="../shared/multitask/worker.ts"/>
///<reference path="../shared/utils/fsHelper.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require("path"), fs = require("fs");
var WriteFileWorker = (function (_super) {
    __extends(WriteFileWorker, _super);
    function WriteFileWorker() {
        _super.apply(this, arguments);
    }
    WriteFileWorker.prototype._onData = function (data) {
        Texturer.Utils.FSHelper.createDirectory(path.dirname(data.file));
        if (fs.existsSync(data.file)) {
            fs.chmodSync(data.file, '0777');
            fs.unlinkSync(data.file);
        }
        var content = new Buffer(data.content);
        fs.writeFileSync(data.file, content);
        this._sendData(null);
    };
    return WriteFileWorker;
})(MultiTask.Worker);
new WriteFileWorker();
//# sourceMappingURL=writeFileWorker.js.map