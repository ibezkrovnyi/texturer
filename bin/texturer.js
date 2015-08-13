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
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var BaseOption = (function () {
            function BaseOption(configObject, inheritValue) {
                this._configObject = configObject || {};
                this._inheritValue = inheritValue;
                this._hasInheritValue = arguments.length >= 2;
            }
            BaseOption.prototype.getValue = function () {
                throw new Error("BaseOption#getValue: this method is abstract");
            };
            BaseOption.prototype._hasDefaultValue = function () {
                return false;
            };
            BaseOption.prototype._getDefaultValue = function () {
                throw new Error("BaseOption#_getDefaultValue: this method is abstract");
            };
            BaseOption.prototype._getPropertyValue = function (propertyName) {
                if (this._configObject && typeof this._configObject === 'object' && this._configObject.hasOwnProperty(propertyName)) {
                    return this._configObject[propertyName];
                }
                if (this._hasInheritValue) {
                    return this._inheritValue;
                }
                if (this._hasDefaultValue()) {
                    return this._getDefaultValue();
                }
                throw new Error("BaseOption#_getPropertyValue: property name '" + propertyName + "' not found in config");
            };
            return BaseOption;
        })();
        Config.BaseOption = BaseOption;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var BruteForceTime = (function (_super) {
            __extends(BruteForceTime, _super);
            function BruteForceTime() {
                _super.apply(this, arguments);
            }
            BruteForceTime.prototype.getValue = function () {
                return this._getPropertyValue('brute-force-time');
            };
            BruteForceTime.prototype._hasDefaultValue = function () {
                return true;
            };
            BruteForceTime.prototype._getDefaultValue = function () {
                return 0;
            };
            return BruteForceTime;
        })(Config.BaseOption);
        Config.BruteForceTime = BruteForceTime;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var ExcludeRegExPattern = (function (_super) {
            __extends(ExcludeRegExPattern, _super);
            function ExcludeRegExPattern() {
                _super.apply(this, arguments);
            }
            ExcludeRegExPattern.prototype.getValue = function () {
                return this._getPropertyValue('exclude');
            };
            ExcludeRegExPattern.prototype._hasDefaultValue = function () {
                return true;
            };
            ExcludeRegExPattern.prototype._getDefaultValue = function () {
                return null;
            };
            return ExcludeRegExPattern;
        })(Config.BaseOption);
        Config.ExcludeRegExPattern = ExcludeRegExPattern;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../../node.d.ts"/>
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var FolderRoot = (function (_super) {
            __extends(FolderRoot, _super);
            function FolderRoot() {
                _super.apply(this, arguments);
            }
            FolderRoot.prototype.getValue = function () {
                return process.cwd();
            };
            return FolderRoot;
        })(Config.BaseOption);
        var FolderFrom = (function (_super) {
            __extends(FolderFrom, _super);
            function FolderFrom() {
                _super.apply(this, arguments);
            }
            FolderFrom.prototype.getValue = function () {
                return this._getPropertyValue('source');
            };
            return FolderFrom;
        })(Config.BaseOption);
        var FolderTo = (function (_super) {
            __extends(FolderTo, _super);
            function FolderTo() {
                _super.apply(this, arguments);
            }
            FolderTo.prototype.getValue = function () {
                return this._getPropertyValue('target');
            };
            return FolderTo;
        })(Config.BaseOption);
        var FolderIndexHtml = (function (_super) {
            __extends(FolderIndexHtml, _super);
            function FolderIndexHtml() {
                _super.apply(this, arguments);
            }
            FolderIndexHtml.prototype.getValue = function () {
                return this._getPropertyValue('images(index.html)');
            };
            return FolderIndexHtml;
        })(Config.BaseOption);
        var Folders = (function () {
            function Folders(configObject) {
                var foldersObject = configObject["folders"];
                this.rootFolder = new FolderRoot(foldersObject).getValue();
                this.fromFolder = new FolderFrom(foldersObject).getValue();
                this.toFolder = new FolderTo(foldersObject).getValue();
                this.indexHtmlFolder = new FolderIndexHtml(foldersObject).getValue();
            }
            return Folders;
        })();
        Config.Folders = Folders;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var TaskFolder = (function (_super) {
            __extends(TaskFolder, _super);
            function TaskFolder() {
                _super.apply(this, arguments);
            }
            TaskFolder.prototype.getValue = function () {
                return this._getPropertyValue('folder');
            };
            return TaskFolder;
        })(Config.BaseOption);
        Config.TaskFolder = TaskFolder;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var PaddingX = (function (_super) {
            __extends(PaddingX, _super);
            function PaddingX() {
                _super.apply(this, arguments);
            }
            PaddingX.prototype.getValue = function () {
                return this._getPropertyValue('padding-x');
            };
            PaddingX.prototype._hasDefaultValue = function () {
                return true;
            };
            PaddingX.prototype._getDefaultValue = function () {
                return 0;
            };
            return PaddingX;
        })(Config.BaseOption);
        Config.PaddingX = PaddingX;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var PaddingY = (function (_super) {
            __extends(PaddingY, _super);
            function PaddingY() {
                _super.apply(this, arguments);
            }
            PaddingY.prototype.getValue = function () {
                return this._getPropertyValue('padding-y');
            };
            PaddingY.prototype._hasDefaultValue = function () {
                return true;
            };
            PaddingY.prototype._getDefaultValue = function () {
                return 0;
            };
            return PaddingY;
        })(Config.BaseOption);
        Config.PaddingY = PaddingY;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var Templates = (function (_super) {
            __extends(Templates, _super);
            function Templates() {
                _super.apply(this, arguments);
            }
            Templates.prototype.getValue = function () {
                return this._getPropertyValue('templates');
            };
            return Templates;
        })(Config.BaseOption);
        Config.Templates = Templates;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var GridStep = (function (_super) {
            __extends(GridStep, _super);
            function GridStep() {
                _super.apply(this, arguments);
            }
            GridStep.prototype.getValue = function () {
                return this._getPropertyValue('grid-step');
            };
            GridStep.prototype._hasDefaultValue = function () {
                return true;
            };
            GridStep.prototype._getDefaultValue = function () {
                return 1;
            };
            return GridStep;
        })(Config.BaseOption);
        Config.GridStep = GridStep;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var RepeatX = (function (_super) {
            __extends(RepeatX, _super);
            function RepeatX() {
                _super.apply(this, arguments);
            }
            RepeatX.prototype.getValue = function () {
                return this._getPropertyValue('repeat-x');
            };
            RepeatX.prototype._hasDefaultValue = function () {
                return true;
            };
            RepeatX.prototype._getDefaultValue = function () {
                return false;
            };
            return RepeatX;
        })(Config.BaseOption);
        Config.RepeatX = RepeatX;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var RepeatY = (function (_super) {
            __extends(RepeatY, _super);
            function RepeatY() {
                _super.apply(this, arguments);
            }
            RepeatY.prototype.getValue = function () {
                return this._getPropertyValue('repeat-y');
            };
            RepeatY.prototype._hasDefaultValue = function () {
                return true;
            };
            RepeatY.prototype._getDefaultValue = function () {
                return false;
            };
            return RepeatY;
        })(Config.BaseOption);
        Config.RepeatY = RepeatY;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var TextureMapFileName = (function (_super) {
            __extends(TextureMapFileName, _super);
            function TextureMapFileName() {
                _super.apply(this, arguments);
            }
            TextureMapFileName.prototype.getValue = function () {
                return this._getPropertyValue('texture-map-file');
            };
            TextureMapFileName.prototype._hasDefaultValue = function () {
                return true;
            };
            TextureMapFileName.prototype._getDefaultValue = function () {
                return 'textureMap' + (TextureMapFileName._uniqueId++) + '.png';
            };
            TextureMapFileName._uniqueId = 0;
            return TextureMapFileName;
        })(Config.BaseOption);
        Config.TextureMapFileName = TextureMapFileName;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var ProcessDataURIEnable = (function (_super) {
            __extends(ProcessDataURIEnable, _super);
            function ProcessDataURIEnable() {
                _super.apply(this, arguments);
            }
            ProcessDataURIEnable.prototype.getValue = function () {
                return this._getPropertyValue('enable');
            };
            ProcessDataURIEnable.prototype._hasDefaultValue = function () {
                return true;
            };
            ProcessDataURIEnable.prototype._getDefaultValue = function () {
                return true;
            };
            return ProcessDataURIEnable;
        })(Config.BaseOption);
        var ProcessDataURIMaxSize = (function (_super) {
            __extends(ProcessDataURIMaxSize, _super);
            function ProcessDataURIMaxSize() {
                _super.apply(this, arguments);
            }
            ProcessDataURIMaxSize.prototype.getValue = function () {
                return this._getPropertyValue('max-size');
            };
            ProcessDataURIMaxSize.prototype._hasDefaultValue = function () {
                return true;
            };
            ProcessDataURIMaxSize.prototype._getDefaultValue = function () {
                return 32 * 1024 - 256;
            };
            return ProcessDataURIMaxSize;
        })(Config.BaseOption);
        var ProcessDataURICreateImageFileAnyway = (function (_super) {
            __extends(ProcessDataURICreateImageFileAnyway, _super);
            function ProcessDataURICreateImageFileAnyway() {
                _super.apply(this, arguments);
            }
            ProcessDataURICreateImageFileAnyway.prototype.getValue = function () {
                return this._getPropertyValue('create-image-file-anyway');
            };
            ProcessDataURICreateImageFileAnyway.prototype._hasDefaultValue = function () {
                return true;
            };
            ProcessDataURICreateImageFileAnyway.prototype._getDefaultValue = function () {
                return false;
            };
            return ProcessDataURICreateImageFileAnyway;
        })(Config.BaseOption);
        var ProcessDataURIContainer = (function (_super) {
            __extends(ProcessDataURIContainer, _super);
            function ProcessDataURIContainer() {
                _super.apply(this, arguments);
            }
            ProcessDataURIContainer.prototype.getValue = function () {
                return this._getPropertyValue('data-uri');
            };
            return ProcessDataURIContainer;
        })(Config.BaseOption);
        var ProcessDataURI = (function () {
            function ProcessDataURI(configObject, inheritDataURI) {
                if (inheritDataURI === void 0) { inheritDataURI = null; }
                var dataURI = new ProcessDataURIContainer(configObject, null).getValue();
                if (inheritDataURI) {
                    this.enable = new ProcessDataURIEnable(dataURI, inheritDataURI.enable).getValue();
                    this.maxSize = new ProcessDataURIMaxSize(dataURI, inheritDataURI.maxSize).getValue();
                    this.createImageFileAnyway = new ProcessDataURICreateImageFileAnyway(dataURI, inheritDataURI.createImageFileAnyway).getValue();
                }
                else {
                    this.enable = new ProcessDataURIEnable(dataURI).getValue();
                    this.maxSize = new ProcessDataURIMaxSize(dataURI).getValue();
                    this.createImageFileAnyway = new ProcessDataURICreateImageFileAnyway(dataURI).getValue();
                }
            }
            return ProcessDataURI;
        })();
        Config.ProcessDataURI = ProcessDataURI;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var ProcessCompressTinyPng = (function (_super) {
            __extends(ProcessCompressTinyPng, _super);
            function ProcessCompressTinyPng() {
                _super.apply(this, arguments);
            }
            ProcessCompressTinyPng.prototype.getValue = function () {
                return this._getPropertyValue('tiny-png');
            };
            ProcessCompressTinyPng.prototype._hasDefaultValue = function () {
                return true;
            };
            ProcessCompressTinyPng.prototype._getDefaultValue = function () {
                return false;
            };
            return ProcessCompressTinyPng;
        })(Config.BaseOption);
        Config.ProcessCompressTinyPng = ProcessCompressTinyPng;
        var ProcessCompressContainer = (function (_super) {
            __extends(ProcessCompressContainer, _super);
            function ProcessCompressContainer() {
                _super.apply(this, arguments);
            }
            ProcessCompressContainer.prototype.getValue = function () {
                return this._getPropertyValue('compression');
            };
            return ProcessCompressContainer;
        })(Config.BaseOption);
        var ProcessCompress = (function () {
            function ProcessCompress(configObject, inheritCompression) {
                if (inheritCompression === void 0) { inheritCompression = null; }
                var compression = new ProcessCompressContainer(configObject, null).getValue();
                if (inheritCompression) {
                    this.tinyPng = new ProcessCompressTinyPng(compression, inheritCompression.tinyPng).getValue();
                }
                else {
                    this.tinyPng = new ProcessCompressTinyPng(compression).getValue();
                }
            }
            return ProcessCompress;
        })();
        Config.ProcessCompress = ProcessCompress;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var ProcessTrimContainer = (function (_super) {
            __extends(ProcessTrimContainer, _super);
            function ProcessTrimContainer() {
                _super.apply(this, arguments);
            }
            ProcessTrimContainer.prototype.getValue = function () {
                return this._getPropertyValue('trim');
            };
            ProcessTrimContainer.prototype._hasDefaultValue = function () {
                return true;
            };
            ProcessTrimContainer.prototype._getDefaultValue = function () {
                return null;
            };
            return ProcessTrimContainer;
        })(Config.BaseOption);
        Config.ProcessTrimContainer = ProcessTrimContainer;
        var ProcessTrimEnable = (function (_super) {
            __extends(ProcessTrimEnable, _super);
            function ProcessTrimEnable() {
                _super.apply(this, arguments);
            }
            ProcessTrimEnable.prototype.getValue = function () {
                return this._getPropertyValue('enable');
            };
            ProcessTrimEnable.prototype._hasDefaultValue = function () {
                return true;
            };
            ProcessTrimEnable.prototype._getDefaultValue = function () {
                return true;
            };
            return ProcessTrimEnable;
        })(Config.BaseOption);
        Config.ProcessTrimEnable = ProcessTrimEnable;
        var ProcessTrimAlpha = (function (_super) {
            __extends(ProcessTrimAlpha, _super);
            function ProcessTrimAlpha() {
                _super.apply(this, arguments);
            }
            ProcessTrimAlpha.prototype.getValue = function () {
                return this._getPropertyValue('alpha');
            };
            ProcessTrimAlpha.prototype._hasDefaultValue = function () {
                return true;
            };
            ProcessTrimAlpha.prototype._getDefaultValue = function () {
                return 0;
            };
            return ProcessTrimAlpha;
        })(Config.BaseOption);
        Config.ProcessTrimAlpha = ProcessTrimAlpha;
        var ProcessTrim = (function () {
            function ProcessTrim(configObject, inheritTrim) {
                if (inheritTrim === void 0) { inheritTrim = null; }
                var trimContainer = new ProcessTrimContainer(configObject).getValue();
                if (inheritTrim) {
                    this.enable = new ProcessTrimEnable(trimContainer, inheritTrim.enable).getValue();
                    this.alpha = new ProcessTrimAlpha(trimContainer, inheritTrim.alpha).getValue();
                }
                else {
                    this.enable = new ProcessTrimEnable(trimContainer).getValue();
                    this.alpha = new ProcessTrimAlpha(trimContainer).getValue();
                }
            }
            return ProcessTrim;
        })();
        Config.ProcessTrim = ProcessTrim;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var ProcessDimensionsContainer = (function (_super) {
            __extends(ProcessDimensionsContainer, _super);
            function ProcessDimensionsContainer() {
                _super.apply(this, arguments);
            }
            ProcessDimensionsContainer.prototype.getValue = function () {
                return this._getPropertyValue('dimensions');
            };
            ProcessDimensionsContainer.prototype._hasDefaultValue = function () {
                return true;
            };
            ProcessDimensionsContainer.prototype._getDefaultValue = function () {
                return null;
            };
            return ProcessDimensionsContainer;
        })(Config.BaseOption);
        Config.ProcessDimensionsContainer = ProcessDimensionsContainer;
        var ProcessDimensionsMaxX = (function (_super) {
            __extends(ProcessDimensionsMaxX, _super);
            function ProcessDimensionsMaxX() {
                _super.apply(this, arguments);
            }
            ProcessDimensionsMaxX.prototype.getValue = function () {
                return this._getPropertyValue('max-x');
            };
            ProcessDimensionsMaxX.prototype._hasDefaultValue = function () {
                return true;
            };
            ProcessDimensionsMaxX.prototype._getDefaultValue = function () {
                return 1920;
            };
            return ProcessDimensionsMaxX;
        })(Config.BaseOption);
        Config.ProcessDimensionsMaxX = ProcessDimensionsMaxX;
        var ProcessDimensionsMaxY = (function (_super) {
            __extends(ProcessDimensionsMaxY, _super);
            function ProcessDimensionsMaxY() {
                _super.apply(this, arguments);
            }
            ProcessDimensionsMaxY.prototype.getValue = function () {
                return this._getPropertyValue('max-y');
            };
            ProcessDimensionsMaxY.prototype._hasDefaultValue = function () {
                return true;
            };
            ProcessDimensionsMaxY.prototype._getDefaultValue = function () {
                return 1080;
            };
            return ProcessDimensionsMaxY;
        })(Config.BaseOption);
        Config.ProcessDimensionsMaxY = ProcessDimensionsMaxY;
        var ProcessDimensions = (function () {
            function ProcessDimensions(configObject, inheritDimensions) {
                if (inheritDimensions === void 0) { inheritDimensions = null; }
                var dimensionsContainer = new ProcessDimensionsContainer(configObject).getValue();
                if (inheritDimensions) {
                    this.maxX = new ProcessDimensionsMaxX(dimensionsContainer, inheritDimensions.maxX).getValue();
                    this.maxY = new ProcessDimensionsMaxY(dimensionsContainer, inheritDimensions.maxY).getValue();
                }
                else {
                    this.maxX = new ProcessDimensionsMaxX(dimensionsContainer).getValue();
                    this.maxY = new ProcessDimensionsMaxY(dimensionsContainer).getValue();
                }
            }
            return ProcessDimensions;
        })();
        Config.ProcessDimensions = ProcessDimensions;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
///<reference path="../process/trim.ts"/>
///<reference path="../process/dataURI.ts"/>
///<reference path="../process/compress.ts"/>
///<reference path="../process/dimensions.ts"/>
///<reference path="../options/bruteForceTime.ts"/>
///<reference path="../options/gridStep.ts"/>
///<reference path="../options/paddingX.ts"/>
///<reference path="../options/paddingY.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var TaskDefaultsContainer = (function (_super) {
            __extends(TaskDefaultsContainer, _super);
            function TaskDefaultsContainer() {
                _super.apply(this, arguments);
            }
            TaskDefaultsContainer.prototype.getValue = function () {
                return this._getPropertyValue('task-defaults');
            };
            return TaskDefaultsContainer;
        })(Config.BaseOption);
        var TaskDefaults = (function () {
            function TaskDefaults(config) {
                var taskDefaultsContainer = new TaskDefaultsContainer(config, null);
                this.bruteForceTime = new Config.BruteForceTime(taskDefaultsContainer).getValue();
                this.gridStep = new Config.GridStep(taskDefaultsContainer).getValue();
                this.paddingX = new Config.PaddingX(taskDefaultsContainer).getValue();
                this.paddingY = new Config.PaddingY(taskDefaultsContainer).getValue();
                this.trim = new Config.ProcessTrim(taskDefaultsContainer);
                this.dataURI = new Config.ProcessDataURI(taskDefaultsContainer);
                this.compress = new Config.ProcessCompress(taskDefaultsContainer);
                this.dimensions = new Config.ProcessDimensions(taskDefaultsContainer);
            }
            return TaskDefaults;
        })();
        Config.TaskDefaults = TaskDefaults;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../../node.d.ts"/>
///<reference path="../process/dataURI.ts"/>
///<reference path="../globalConfig.ts"/>
///<reference path="../../utils/fsHelper.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var path = require("path");
        var CopyTask = (function () {
            function CopyTask(taskObject, globalConfig) {
                this.folder = new Config.TaskFolder(taskObject).getValue();
                this.dataURI = new Config.ProcessDataURI(taskObject, globalConfig.taskDefaults.dataURI);
                this.files = this._getFiles(globalConfig);
            }
            CopyTask.prototype._getFiles = function (globalConfig) {
                var _this = this;
                var folder = this.folder, fullFolder = path.join(globalConfig.folders.rootFolder, globalConfig.folders.fromFolder, folder);
                Texturer.Utils.FSHelper.checkDirectoryExistsSync(fullFolder);
                var regex = globalConfig.excludeRegExPattern ? new RegExp(globalConfig.excludeRegExPattern, "gi") : null, filter = regex ? function (name) {
                    regex.lastIndex = 0;
                    return regex.test(name);
                } : null;
                var files = Texturer.Utils.FSHelper.getFilesInFolder(fullFolder, filter, true).map(function (file) {
                    return path.join(_this.folder, file).replace(/\\/g, "/");
                });
                if (files.length <= 0) {
                    throw "no files in fullfolder " + folder;
                }
                return files;
            };
            ;
            return CopyTask;
        })();
        Config.CopyTask = CopyTask;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
///<reference path="../globalConfig.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var CopyTasksContainer = (function (_super) {
            __extends(CopyTasksContainer, _super);
            function CopyTasksContainer() {
                _super.apply(this, arguments);
            }
            CopyTasksContainer.prototype.getValue = function () {
                return this._getPropertyValue('copy-tasks');
            };
            CopyTasksContainer.prototype._hasDefaultValue = function () {
                return true;
            };
            CopyTasksContainer.prototype._getDefaultValue = function () {
                return [];
            };
            return CopyTasksContainer;
        })(Config.BaseOption);
        var CopyTasks = (function () {
            function CopyTasks(configObject, globalConfig) {
                this._configObject = configObject;
                this._globalConfig = globalConfig;
            }
            CopyTasks.prototype.getValue = function () {
                var _this = this;
                return new CopyTasksContainer(this._configObject).getValue().map(function (taskObject) { return new Config.CopyTask(taskObject, _this._globalConfig); });
            };
            return CopyTasks;
        })();
        Config.CopyTasks = CopyTasks;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../process/trim.ts"/>
///<reference path="../process/dataURI.ts"/>
///<reference path="../process/compress.ts"/>
///<reference path="../process/dimensions.ts"/>
///<reference path="../options/taskFolder.ts"/>
///<reference path="../globalConfig.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var path = require("path");
        var TextureMapTask = (function () {
            function TextureMapTask(taskObject, globalConfig) {
                this.folder = new Config.TaskFolder(taskObject).getValue();
                this.textureMapFileName = new Config.TextureMapFileName(taskObject).getValue();
                this.repeatX = new Config.RepeatX(taskObject).getValue();
                this.repeatY = new Config.RepeatY(taskObject).getValue();
                this.gridStep = new Config.GridStep(taskObject, globalConfig.taskDefaults.gridStep).getValue();
                this.paddingX = new Config.PaddingX(taskObject, globalConfig.taskDefaults.paddingX).getValue();
                this.paddingY = new Config.PaddingY(taskObject, globalConfig.taskDefaults.paddingY).getValue();
                this.bruteForceTime = new Config.BruteForceTime(taskObject, globalConfig.taskDefaults.bruteForceTime).getValue();
                this.dimensions = new Config.ProcessDimensions(taskObject, globalConfig.taskDefaults.dimensions);
                this.trim = new Config.ProcessTrim(taskObject, globalConfig.taskDefaults.trim);
                this.dataURI = new Config.ProcessDataURI(taskObject, globalConfig.taskDefaults.dataURI);
                this.compress = new Config.ProcessCompress(taskObject, globalConfig.taskDefaults.compress);
                this.files = this._getFiles(globalConfig);
            }
            TextureMapTask.prototype._getFiles = function (globalConfig) {
                var _this = this;
                var folder = this.folder, fullFolder = path.join(globalConfig.folders.rootFolder, globalConfig.folders.fromFolder, folder);
                Texturer.Utils.FSHelper.checkDirectoryExistsSync(fullFolder);
                var regex = globalConfig.excludeRegExPattern ? new RegExp(globalConfig.excludeRegExPattern, "gi") : null, filter = regex ? function (name) {
                    regex.lastIndex = 0;
                    return regex.test(name);
                } : null;
                var files = Texturer.Utils.FSHelper.getFilesInFolder(fullFolder, filter, true).map(function (file) {
                    return path.join(_this.folder, file).replace(/\\/g, "/");
                });
                if (files.length <= 0) {
                    throw "no files in fullfolder " + folder;
                }
                return files;
            };
            ;
            return TextureMapTask;
        })();
        Config.TextureMapTask = TextureMapTask;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="../baseOption.ts"/>
///<reference path="textureMapTask.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var TextureMapTasksContainer = (function (_super) {
            __extends(TextureMapTasksContainer, _super);
            function TextureMapTasksContainer() {
                _super.apply(this, arguments);
            }
            TextureMapTasksContainer.prototype.getValue = function () {
                return this._getPropertyValue('texture-map-tasks');
            };
            TextureMapTasksContainer.prototype._hasDefaultValue = function () {
                return true;
            };
            TextureMapTasksContainer.prototype._getDefaultValue = function () {
                return [];
            };
            return TextureMapTasksContainer;
        })(Config.BaseOption);
        var TextureMapTasks = (function () {
            function TextureMapTasks(configObject, globalConfig) {
                this._configObject = configObject;
                this._globalConfig = globalConfig;
            }
            TextureMapTasks.prototype.getValue = function () {
                var _this = this;
                return new TextureMapTasksContainer(this._configObject).getValue().map(function (taskObject) { return new Config.TextureMapTask(taskObject, _this._globalConfig); });
            };
            return TextureMapTasks;
        })();
        Config.TextureMapTasks = TextureMapTasks;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
///<reference path="baseOption.ts"/>
///<reference path="options/bruteForceTime.ts"/>
///<reference path="options/excludeRegExPattern.ts"/>
///<reference path="options/folders.ts"/>
///<reference path="options/taskFolder.ts"/>
///<reference path="options/paddingX.ts"/>
///<reference path="options/paddingY.ts"/>
///<reference path="options/templates.ts"/>
///<reference path="options/gridStep.ts"/>
///<reference path="options/repeatX.ts"/>
///<reference path="options/repeatY.ts"/>
///<reference path="options/textureMapFileName.ts"/>
///<reference path="process/dataURI.ts"/>
///<reference path="process/compress.ts"/>
///<reference path="process/trim.ts"/>
///<reference path="process/dimensions.ts"/>
///<reference path="tasks/taskDefaults.ts"/>
///<reference path="tasks/copyTask.ts"/>
///<reference path="tasks/copyTasks.ts"/>
///<reference path="tasks/textureMapTask.ts"/>
///<reference path="tasks/textureMapTasks.ts"/>
var Texturer;
(function (Texturer) {
    var Config;
    (function (Config) {
        var path = require('path');
        var GlobalConfig = (function () {
            function GlobalConfig(config) {
                this.folders = new Config.Folders(config);
                Texturer.Utils.FSHelper.createDirectory(this.getFolderRootToIndexHtml());
                this.templates = new Config.Templates(config).getValue();
                this.excludeRegExPattern = new Config.ExcludeRegExPattern(config).getValue();
                this.taskDefaults = new Config.TaskDefaults(config);
                this.textureMapTasks = new Config.TextureMapTasks(config, this).getValue();
                this.copyTasks = new Config.CopyTasks(config, this).getValue();
            }
            GlobalConfig.prototype.getFolderRootFrom = function () {
                return path.join(this.folders.rootFolder, this.folders.fromFolder);
            };
            GlobalConfig.prototype.getFolderRootTo = function () {
                return path.join(this.folders.rootFolder, this.folders.toFolder);
            };
            GlobalConfig.prototype.getFolderRootToIndexHtml = function () {
                return path.join(this.folders.rootFolder, this.folders.toFolder, this.folders.indexHtmlFolder);
            };
            return GlobalConfig;
        })();
        Config.GlobalConfig = GlobalConfig;
    })(Config = Texturer.Config || (Texturer.Config = {}));
})(Texturer || (Texturer = {}));
var Texturer;
(function (Texturer) {
    var Containers;
    (function (Containers) {
        var Rect = (function () {
            function Rect() {
            }
            return Rect;
        })();
        Containers.Rect = Rect;
    })(Containers = Texturer.Containers || (Texturer.Containers = {}));
})(Texturer || (Texturer = {}));
///<reference path="rect.ts"/>
var Texturer;
(function (Texturer) {
    var Containers;
    (function (Containers) {
        var LoadedFile = (function () {
            function LoadedFile(width, height, realWidth, realHeight, opaque, trim, bitmap) {
                this._width = width;
                this._height = height;
                this._realWidth = realWidth;
                this._realHeight = realHeight;
                this._opaque = opaque;
                this._trim = trim;
                this._bitmap = bitmap;
            }
            LoadedFile.prototype.isOpaque = function () {
                return this._opaque;
            };
            LoadedFile.prototype.getWidth = function () {
                return this._width;
            };
            LoadedFile.prototype.getHeight = function () {
                return this._height;
            };
            LoadedFile.prototype.getRealWidth = function () {
                return this._realWidth;
            };
            LoadedFile.prototype.getRealHeight = function () {
                return this._realHeight;
            };
            LoadedFile.prototype.getTrim = function () {
                return this._trim;
            };
            LoadedFile.prototype.getBitmap = function () {
                return this._bitmap;
            };
            return LoadedFile;
        })();
        Containers.LoadedFile = LoadedFile;
    })(Containers = Texturer.Containers || (Texturer.Containers = {}));
})(Texturer || (Texturer = {}));
///<reference path="rect.ts"/>
var Texturer;
(function (Texturer) {
    var Containers;
    (function (Containers) {
        var FileDimensions = (function () {
            function FileDimensions(id, width, height) {
                this.id = id;
                this.width = width;
                this.height = height;
            }
            return FileDimensions;
        })();
        Containers.FileDimensions = FileDimensions;
        var TextureImage = (function () {
            function TextureImage() {
                this._realWidth = 0;
                this._realHeight = 0;
                this._bitmap = null;
                this._trim = null;
                this._opaque = false;
            }
            TextureImage.prototype.setData = function (realWidth, realHeight, bitmap, trim, isOpaque) {
                this._realWidth = realWidth;
                this._realHeight = realHeight;
                this._bitmap = bitmap;
                this._trim = trim;
                this._opaque = isOpaque;
            };
            TextureImage.prototype.getOpaque = function () {
                return this._opaque;
            };
            TextureImage.prototype.getTrim = function () {
                return this._trim;
            };
            TextureImage.prototype.getBitmap = function () {
                return this._bitmap;
            };
            TextureImage.prototype.getRealHeight = function () {
                return this._realHeight;
            };
            TextureImage.prototype.getRealWidth = function () {
                return this._realWidth;
            };
            return TextureImage;
        })();
        Containers.TextureImage = TextureImage;
        var Texture = (function () {
            function Texture() {
                this._x = 0;
                this._y = 0;
                this._width = 0;
                this._height = 0;
                this._image = null;
            }
            Texture.prototype.setData = function (x, y, width, height) {
                this._x = x;
                this._y = y;
                this._width = width;
                this._height = height;
            };
            Texture.prototype.getImage = function () {
                return this._image;
            };
            Texture.prototype.setTextureImage = function (textureImage) {
                this._image = textureImage;
            };
            Texture.prototype.getHeight = function () {
                return this._height;
            };
            Texture.prototype.getWidth = function () {
                return this._width;
            };
            Texture.prototype.getY = function () {
                return this._y;
            };
            Texture.prototype.getX = function () {
                return this._x;
            };
            return Texture;
        })();
        Containers.Texture = Texture;
        var TextureMap = (function () {
            function TextureMap() {
                this._width = 0;
                this._height = 0;
                this._file = null;
                this._dataURI = null;
                this._repeatX = false;
                this._repeatY = false;
                this._textures = {};
            }
            TextureMap.prototype.setData = function (file, width, height, repeatX, repeatY) {
                this._file = file;
                this._width = width;
                this._height = height;
                this._repeatX = repeatX;
                this._repeatY = repeatY;
            };
            TextureMap.prototype.setDataURI = function (dataURI) {
                this._dataURI = dataURI;
            };
            TextureMap.prototype.getDataURI = function () {
                return this._dataURI;
            };
            TextureMap.prototype.setTexture = function (id, texture) {
                this._textures[id] = texture;
            };
            TextureMap.prototype.getTexture = function (id) {
                return this._textures[id];
            };
            TextureMap.prototype.getTextureIds = function () {
                return Object.keys(this._textures);
            };
            TextureMap.prototype.getFile = function () {
                return this._file;
            };
            TextureMap.prototype.getRepeatX = function () {
                return this._repeatX;
            };
            TextureMap.prototype.getRepeatY = function () {
                return this._repeatY;
            };
            TextureMap.prototype.getWidth = function () {
                return this._width;
            };
            TextureMap.prototype.getHeight = function () {
                return this._height;
            };
            TextureMap.prototype.getArea = function () {
                return this._width * this._height;
            };
            return TextureMap;
        })();
        Containers.TextureMap = TextureMap;
    })(Containers = Texturer.Containers || (Texturer.Containers = {}));
})(Texturer || (Texturer = {}));
///<reference path="../node.d.ts"/>
///<reference path="../config/globalConfig.ts"/>
///<reference path="../containers/loadedFile.ts"/>
///<reference path="../containers/textureMap.ts"/>
var Texturer;
(function (Texturer) {
    var Utils;
    (function (Utils) {
        var fs = require("fs"), path = require("path");
        var TexturePoolWriter = (function () {
            function TexturePoolWriter() {
            }
            TexturePoolWriter.prototype.writeTexturePoolFile = function (folderRootTo, configParser, loadedFiles, textureMapImages) {
                var _this = this;
                var templateTexturesArray = [], templateMapsArray = [], usedPixels = 0, trimmedPixels = 0;
                textureMapImages.forEach(function (map, mapIndex) {
                    console.log("map file = " + map.getFile());
                    var url = path.join(configParser.folders.indexHtmlFolder, map.getFile()).replace(/\\/g, "/"), dataURI = map.getDataURI(), textureIds = map.getTextureIds(), isLastTextureMap = mapIndex + 1 === textureMapImages.length;
                    templateMapsArray.push({
                        "url": url,
                        "dataURI": dataURI,
                        "is-last-item": isLastTextureMap,
                        "width": map.getWidth(),
                        "height": map.getHeight(),
                        "repeat-x": map.getRepeatX(),
                        "repeat-y": map.getRepeatY()
                    });
                    textureIds.forEach(function (id, textureIndex) {
                        var texture = map.getTexture(id), loadedFile = loadedFiles[id], trim = loadedFile.getTrim(), isLastTexture = textureIndex + 1 === textureIds.length;
                        usedPixels += texture.getWidth() * texture.getHeight();
                        trimmedPixels += (trim.left + trim.right) * (trim.top + trim.bottom);
                        templateTexturesArray.push({
                            "id": Utils.FSHelper.getFileNameWithoutExtension(id),
                            "file": id,
                            "map-index": mapIndex,
                            "url": url,
                            "dataURI": dataURI,
                            "x": texture.getX(),
                            "y": texture.getY(),
                            "width": texture.getWidth(),
                            "height": texture.getHeight(),
                            "real-width": loadedFile.getRealWidth(),
                            "real-height": loadedFile.getRealHeight(),
                            "trim": trim,
                            "opaque": loadedFile.isOpaque(),
                            "repeat-x": map.getRepeatX(),
                            "repeat-y": map.getRepeatY(),
                            "is-last-item": isLastTexture && isLastTextureMap
                        });
                    });
                });
                var duplicateFileNamesArray = [];
                templateTexturesArray.forEach(function (d1, i1) {
                    templateTexturesArray.forEach(function (d2, i2) {
                        if (d1["id"] === d2["id"] && i1 !== i2) {
                            duplicateFileNamesArray.push(d1["file"]);
                        }
                    });
                });
                console.log("used pixels: " + usedPixels);
                console.log("trimmed pixels: " + trimmedPixels);
                var data = {
                    maps: templateMapsArray,
                    textures: templateTexturesArray
                };
                var folder = path.join(__dirname, "..", "templates");
                configParser.templates.forEach(function (templateFile) {
                    if (fs.existsSync(path.join(folder, templateFile))) {
                        _this._exportTexturePoolViaHandlebarsTemplate(folderRootTo, templateFile, folder, data);
                    }
                });
                return duplicateFileNamesArray;
            };
            TexturePoolWriter.prototype._exportTexturePoolViaHandlebarsTemplate = function (folderRootTo, file, folder, data) {
                var Handlebars = require("Handlebars");
                if (Utils.FSHelper.getExtension(file).toLowerCase() === "hbs") {
                    var text = fs.readFileSync(path.join(folder, file), 'utf8');
                    if (text && text.length > 0) {
                        text = text.replace(/\r/g, "");
                        var lines = text.split("\n"), template;
                        if (lines.length > 1 && lines[0]) {
                            var resultFile = path.join(folderRootTo, lines[0]);
                            text = lines.slice(1).join("\n");
                            template = Handlebars.compile(text);
                            if (template) {
                                Utils.FSHelper.createDirectory(path.dirname(resultFile));
                                fs.writeFileSync(resultFile, template(data));
                            }
                            else {
                                console.log("template error in " + resultFile);
                            }
                        }
                    }
                }
            };
            return TexturePoolWriter;
        })();
        Utils.TexturePoolWriter = TexturePoolWriter;
    })(Utils = Texturer.Utils || (Texturer.Utils = {}));
})(Texturer || (Texturer = {}));
///<reference path="../node.d.ts"/>
///<reference path="fsHelper.ts"/>
var Texturer;
(function (Texturer) {
    var Utils;
    (function (Utils) {
        var fs = require("fs"), extensionToMimeTypeMap = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "bmp": "image/bmp"
        };
        var DataURIEncoder = (function () {
            function DataURIEncoder() {
            }
            DataURIEncoder.prototype.encodeBuffer = function (buffer, mimeType) {
                return "data:" + mimeType + ";base64," + buffer.toString('base64');
            };
            DataURIEncoder.prototype.encodeFile = function (file) {
                return this.encodeBuffer(fs.readFileSync(file), this._getImageMimeTypeByFileName(file));
            };
            DataURIEncoder.prototype._getImageMimeTypeByFileName = function (file) {
                var extension = Utils.FSHelper.getExtension(file).toLowerCase();
                if (extension in extensionToMimeTypeMap) {
                    return extensionToMimeTypeMap[extension];
                }
                throw new Error("DataURIEncoder#_getImageMimeTypeByFileName: extension ." + extension + " is unsupported");
            };
            return DataURIEncoder;
        })();
        Utils.DataURIEncoder = DataURIEncoder;
    })(Utils = Texturer.Utils || (Texturer.Utils = {}));
})(Texturer || (Texturer = {}));
/// <reference path='../node.d.ts' />
///<reference path="../node.d.ts"/>
///<reference path="types.ts"/>
var child_process = require("child_process"), os = require('os'), path = require("path");
var MultiTask;
(function (MultiTask) {
    var debugPort = 0;
    for (var _i = 0, _a = process.execArgv; _i < _a.length; _i++) {
        var arg = _a[_i];
        var p = arg.split("=");
        if (p[0] === "--debug-brk") {
            debugPort = parseInt(p[1], 10) + 1;
        }
    }
    var ForkContainer = (function () {
        function ForkContainer(tasksFolder, callback, thisArg) {
            this._tasksFolder = tasksFolder;
            this._callback = callback;
            this._thisArg = thisArg;
            this._task = null;
            this._online = false;
        }
        ForkContainer.prototype.send = function (task) {
            this._fork(path.join(this._tasksFolder, task.getFile()));
            if (this._task === null) {
                this._task = task;
                if (this._online) {
                    this._startTask();
                }
            }
            else {
                console.error("ERROR: workerDescriptor can't send message. It is already busy");
            }
        };
        ForkContainer.prototype.kill = function () {
            var worker = this._worker;
            if (worker) {
                this._online = false;
                this._worker = null;
                worker.kill();
            }
        };
        ForkContainer.prototype._startTask = function () {
            this._worker.send(this._task.getWorkerData());
        };
        ForkContainer.prototype._fork = function (file) {
            var _this = this;
            if (!this._worker) {
                this._worker = child_process.fork(file, { execArgv: debugPort ? [("--debug-brk=" + debugPort++)] : [] });
                this._worker.on("message", function (data) {
                    switch (data) {
                        case "online":
                            _this._online = true;
                            if (_this._task) {
                                _this._startTask();
                            }
                            break;
                        default:
                            var task = _this._task;
                            if (task !== null) {
                                _this._task = null;
                                if (data.error) {
                                    _this.kill();
                                }
                                _this._callback.call(_this._thisArg, _this, task, data.error, data.data);
                            }
                            break;
                    }
                });
            }
        };
        return ForkContainer;
    })();
    var Master = (function () {
        function Master(tasksFolder, maxSimultaneousTasks) {
            if (maxSimultaneousTasks === void 0) { maxSimultaneousTasks = os.cpus().length; }
            this._tasksFolder = tasksFolder;
            this._shutdown = { callback: null, scheduled: false };
            this._tasks = [];
            this._availableForkContainers = null;
            this._busyForkContainers = null;
            this._busyForkContainersCount = 0;
            this._maxSimultaneousTasks = maxSimultaneousTasks;
            this.restart();
        }
        Master.prototype.restart = function () {
            this._availableForkContainers = {};
            this._busyForkContainers = {};
            this._tasks = [];
        };
        Master.prototype.runTask = function (task) {
            this._prepareForTask(task);
            this._tasks.push(task);
            this._tryToRunTask();
        };
        Master.prototype.shutdown = function (callback) {
            this._shutdown.callback = callback;
            this._shutdown.scheduled = true;
            this._tryToShutdown();
        };
        Master.prototype.abort = function () {
            var _this = this;
            Object.keys(this._availableForkContainers).forEach(function (key) {
                _this._availableForkContainers[key].forEach(function (workerDescriptor) {
                    workerDescriptor.kill();
                });
            });
            this._availableForkContainers = null;
            Object.keys(this._busyForkContainers).forEach(function (key) {
                _this._busyForkContainers[key].forEach(function (workerDescriptor) {
                    workerDescriptor.kill();
                });
            });
            this._busyForkContainers = null;
        };
        Master.prototype._tryToShutdown = function () {
            var _this = this;
            var hasBusyWorkers = false;
            Object.keys(this._busyForkContainers).forEach(function (key) {
                if (_this._busyForkContainers[key].length > 0)
                    hasBusyWorkers = true;
            });
            if (this._tasks.length === 0 && !hasBusyWorkers) {
                this.abort();
                this._tasks = null;
                this._shutdown.scheduled = false;
                var callback = this._shutdown.callback;
                if (callback) {
                    this._shutdown.callback = null;
                    callback();
                }
            }
        };
        Master.prototype._tryToRunTask = function () {
            if (this._tasks.length > 0) {
                var task = this._tasks[0], forkContainer = this._getAvailableForkContainer(task);
                if (forkContainer) {
                    this._tasks.shift();
                    this._busyForkContainers[task.getFile()].push(forkContainer);
                    forkContainer.send(task);
                    this._busyForkContainersCount++;
                }
            }
        };
        Master.prototype._onMessage = function (forkContainer, task, error, taskResult) {
            var taskName = task.getFile(), index = this._busyForkContainers[taskName].indexOf(forkContainer);
            if (index >= 0) {
                this._busyForkContainers[taskName].splice(index, 1);
                if (!error) {
                    this._availableForkContainers[taskName].push(forkContainer);
                }
                this._busyForkContainersCount--;
            }
            else {
                console.log("ERROR: forkContainer not found in busy list. Very strange!");
            }
            if (this._tasks.length > 0) {
                this._tryToRunTask();
            }
            else if (this._shutdown.scheduled) {
                this._tryToShutdown();
            }
            task.onData(error, taskResult);
        };
        Master.prototype._getAvailableForkContainer = function (task) {
            var taskName = task.getFile();
            if (this._busyForkContainersCount < this._maxSimultaneousTasks) {
                if (this._availableForkContainers[taskName].length === 0) {
                    var forkContainer = new ForkContainer(this._tasksFolder, this._onMessage, this);
                    this._availableForkContainers[taskName].push(forkContainer);
                }
                return this._availableForkContainers[taskName].pop();
            }
            return null;
        };
        Master.prototype._prepareForTask = function (task) {
            var taskName = task.getFile();
            if (!this._availableForkContainers.hasOwnProperty(taskName)) {
                this._availableForkContainers[taskName] = [];
            }
            if (!this._busyForkContainers.hasOwnProperty(taskName)) {
                this._busyForkContainers[taskName] = [];
            }
        };
        return Master;
    })();
    MultiTask.Master = Master;
})(MultiTask || (MultiTask = {}));
///<reference path="../../shared/containers/binPackerResult.ts"/>
///<reference path="../../shared/multitask/types.ts"/>
///<reference path="../../shared/config/tasks/textureMapTask.ts"/>
///<reference path="../../shared/containers/textureMap.ts"/>
var Texturer;
(function (Texturer) {
    var BinPackerMaster = (function () {
        function BinPackerMaster(textureMapTask, files, targetRectangle, totalPixels, callback) {
            this._textureMapTask = textureMapTask;
            this._callback = callback;
            this._data = {
                fromX: targetRectangle.left,
                toX: targetRectangle.right,
                fromY: targetRectangle.top,
                toY: targetRectangle.bottom,
                totalPixels: totalPixels,
                files: files,
                gridStep: textureMapTask.gridStep,
                paddingX: textureMapTask.paddingX,
                paddingY: textureMapTask.paddingY
            };
        }
        BinPackerMaster.prototype.getFile = function () {
            return 'binPackerWorker.js';
        };
        BinPackerMaster.prototype.getWorkerData = function () {
            return this._data;
        };
        BinPackerMaster.prototype.onData = function (error, data) {
            if (error) {
                throw new Error(error);
            }
            else {
                if (!data) {
                    this._callback(null);
                }
                else {
                    var width = data.width, height = data.height, textureIds = Object.keys(data.rectangles);
                    var textureMap = new Texturer.Containers.TextureMap();
                    textureMap.setData(this._textureMapTask.textureMapFileName, width, height, this._textureMapTask.repeatX, this._textureMapTask.repeatY);
                    for (var _i = 0; _i < textureIds.length; _i++) {
                        var id = textureIds[_i];
                        var texture = new Texturer.Containers.Texture(), textureContainer = data.rectangles[id];
                        texture.setData(textureContainer.x, textureContainer.y, textureContainer.width, textureContainer.height);
                        textureMap.setTexture(id, texture);
                    }
                    this._callback(textureMap);
                }
            }
        };
        return BinPackerMaster;
    })();
    Texturer.BinPackerMaster = BinPackerMaster;
})(Texturer || (Texturer = {}));
///<reference path="../shared/multitask/master.ts"/>
///<reference path="../shared/containers/textureMap.ts"/>
///<reference path="../shared/config/tasks/textureMapTask.ts"/>
///<reference path="tasks/binPackerMaster.ts"/>
var Texturer;
(function (Texturer) {
    var path = require("path");
    var TextureMapGenerator = (function () {
        function TextureMapGenerator(cq) {
            this._cq = cq;
        }
        TextureMapGenerator.prototype.generateTextureMap = function (files, textureMapTask, callback) {
            try {
                var totalPixels = 0;
                files.forEach(function (file) {
                    totalPixels += file.width * file.height;
                });
                this._plannedPlaceFilesTests = 3;
                this._finishedPlaceFilesTests = 0;
                this._textureMap = null;
                this._callback = callback;
                this._totalPixels = totalPixels;
                this._endTime = Date.now() + textureMapTask.bruteForceTime;
                var targetRectangle = this._checkFiles(textureMapTask, files);
                this._textureMapTask = textureMapTask;
                this._targetRectangle = targetRectangle;
                this._files = files;
                this._placeFiles(textureMapTask, targetRectangle, files.sort(function (a, b) { return (b.width * b.height - a.width * a.height) || (b.id > a.id ? 1 : -1); }));
                this._placeFiles(textureMapTask, targetRectangle, files.sort(function (a, b) { return (b.width - a.width) || (b.id > a.id ? 1 : -1); }));
                this._placeFiles(textureMapTask, targetRectangle, files.sort(function (a, b) { return (b.height - a.height) || (b.id > a.id ? 1 : -1); }));
            }
            catch (e) {
                callback(e.stack, null);
            }
        };
        TextureMapGenerator.prototype._onPlaceFilesFinished = function (error, bestTextureMap) {
            if (!error && bestTextureMap) {
                if (this._textureMap === null || bestTextureMap.getArea() < this._textureMap.getArea()) {
                    this._textureMap = bestTextureMap;
                }
            }
            this._finishedPlaceFilesTests++;
            if (this._finishedPlaceFilesTests === this._plannedPlaceFilesTests) {
                if (Date.now() < this._endTime) {
                    this._plannedPlaceFilesTests++;
                    this._placeFiles(this._textureMapTask, this._targetRectangle, this._getShuffledArray(this._files));
                }
                else {
                    if (this._textureMap && this._textureMap.getArea() > 0) {
                        this._callback(null, this._textureMap);
                    }
                    else {
                        this._callback(null, null);
                    }
                }
            }
        };
        TextureMapGenerator.prototype._placeFiles = function (textureMapTask, targetRectangle, files) {
            var _this = this;
            this._cq.runTask(new Texturer.BinPackerMaster(textureMapTask, files, targetRectangle, this._totalPixels, function (textureMap) {
                _this._onPlaceFilesFinished(null, textureMap);
            }));
        };
        TextureMapGenerator.prototype._getShuffledArray = function (arr) {
            var shuffled = arr.slice(0);
            for (var i = 0; i < shuffled.length - 1; i++) {
                var l = shuffled.length;
                var index = ((Math.random() * (l - i)) | 0) + i;
                var tmp = shuffled[index];
                shuffled[index] = shuffled[i];
                shuffled[i] = tmp;
            }
            return shuffled;
        };
        TextureMapGenerator.prototype._checkFiles = function (textureMapTask, files) {
            var targetRectangle = {
                left: 4,
                right: textureMapTask.dimensions.maxX,
                top: 4,
                bottom: textureMapTask.dimensions.maxY
            };
            if (textureMapTask.repeatX && textureMapTask.repeatY) {
                throw new Error("TextureMapGenerator#_checkFiles: Sprite can't be repeat-x and repeat-y at the same time");
            }
            if (textureMapTask.repeatX) {
                targetRectangle.left = targetRectangle.right = files[0].width;
                files.forEach(function (file) {
                    if (file.width !== targetRectangle.left) {
                        throw new Error("TextureMapGenerator#_checkFiles: All images in folder " + textureMapTask.folder + " should have the same width to repeat by X axis");
                    }
                });
            }
            if (textureMapTask.repeatY) {
                targetRectangle.top = targetRectangle.bottom = files[0].height;
                files.forEach(function (file) {
                    if (file.height !== targetRectangle.top) {
                        throw new Error("TextureMapGenerator#_checkFiles: All images in folder " + textureMapTask.folder + " should have the same width to repeat by Y axis");
                    }
                });
            }
            return targetRectangle;
        };
        return TextureMapGenerator;
    })();
    Texturer.TextureMapGenerator = TextureMapGenerator;
})(Texturer || (Texturer = {}));
///<reference path="../../shared/multitask/types.ts"/>
var Texturer;
(function (Texturer) {
    var CompressImageMaster = (function () {
        function CompressImageMaster(data, callback) {
            this._data = data;
            this._callback = callback;
        }
        CompressImageMaster.prototype.getFile = function () {
            return 'compressImageWorker.js';
        };
        CompressImageMaster.prototype.getWorkerData = function () {
            return this._data;
        };
        CompressImageMaster.prototype.onData = function (error, data) {
            this._callback(error, data);
        };
        return CompressImageMaster;
    })();
    Texturer.CompressImageMaster = CompressImageMaster;
})(Texturer || (Texturer = {}));
///<reference path="../../shared/multitask/types.ts"/>
var Texturer;
(function (Texturer) {
    var TinyPngMaster = (function () {
        function TinyPngMaster(data, callback) {
            this._data = data;
            this._callback = callback;
        }
        TinyPngMaster.prototype.getFile = function () {
            return 'tinyPngWorker.js';
        };
        TinyPngMaster.prototype.getWorkerData = function () {
            return this._data;
        };
        TinyPngMaster.prototype.onData = function (error, data) {
            this._callback(error, data);
        };
        return TinyPngMaster;
    })();
    Texturer.TinyPngMaster = TinyPngMaster;
})(Texturer || (Texturer = {}));
///<reference path="../../shared/multitask/types.ts"/>
var Texturer;
(function (Texturer) {
    var WriteFileMaster = (function () {
        function WriteFileMaster(data, callback) {
            this._data = data;
            this._callback = callback;
        }
        WriteFileMaster.prototype.getFile = function () {
            return 'writeFileWorker.js';
        };
        WriteFileMaster.prototype.getWorkerData = function () {
            return this._data;
        };
        WriteFileMaster.prototype.onData = function (error, data) {
            this._callback(error, data);
        };
        return WriteFileMaster;
    })();
    Texturer.WriteFileMaster = WriteFileMaster;
})(Texturer || (Texturer = {}));
///<reference path="../containers/textureMap.ts"/>
///<reference path="../node.d.ts"/>
///<reference path="../config/globalConfig.ts"/>
///<reference path="../multitask/master.ts"/>
///<reference path="../containers/loadedFile.ts"/>
///<reference path="../../texturer/textureMapGenerator.ts"/>
///<reference path="../../texturer/tasks/compressImageMaster.ts"/>
///<reference path="../../texturer/tasks/tinyPngMaster.ts"/>
///<reference path="dataURIEncoder.ts"/>
///<reference path="../../texturer/tasks/writeFileMaster.ts"/>
var Texturer;
(function (Texturer) {
    var Utils;
    (function (Utils) {
        var path = require("path");
        var TextureMapTaskRunner = (function () {
            function TextureMapTaskRunner(globalConfig, textureMapTask, loadedFiles, clusterQueue, callback) {
                this._globalConfig = globalConfig;
                this._textureMapTask = textureMapTask;
                this._loadedFiles = loadedFiles;
                this._clusterQueue = clusterQueue;
                this._callback = callback;
            }
            TextureMapTaskRunner.prototype.run = function () {
                var _this = this;
                var fileDimensionsArray = this._textureMapTask.files.map(function (file) {
                    var loadedFile = _this._loadedFiles[file];
                    return new Texturer.Containers.FileDimensions(file, loadedFile.getWidth(), loadedFile.getHeight());
                });
                var textureMapGenerator = new Texturer.TextureMapGenerator(this._clusterQueue);
                textureMapGenerator.generateTextureMap(fileDimensionsArray, this._textureMapTask, function (error, textureMap) {
                    if (textureMap) {
                        _this._compressTextureMapImage(textureMap);
                    }
                    else {
                        _this._callback(new Error("Texture Generator: Can't pack texture map for folder '" + _this._textureMapTask.folder + "' - too large art. Split images into 2 or more folders!"), null);
                    }
                });
            };
            TextureMapTaskRunner.prototype._compressTextureMapImage = function (textureMap) {
                var _this = this;
                console.log(this._textureMapTask.textureMapFileName + ": w = " + textureMap.getWidth() + ", h = " + textureMap.getHeight() + ", area = " + textureMap.getArea());
                var textureArray = [];
                textureMap.getTextureIds().forEach(function (id) {
                    var loadedFile = _this._loadedFiles[id], texture = textureMap.getTexture(id);
                    textureArray.push({
                        x: texture.getX(),
                        y: texture.getY(),
                        width: texture.getWidth(),
                        height: texture.getHeight(),
                        realWidth: loadedFile.getRealWidth(),
                        realHeight: loadedFile.getRealHeight(),
                        bitmapSerialized: loadedFile.getBitmap()
                    });
                });
                var bestCompressedImage = null, filterCount = 0, filterTypes = [0, 1, 2, 3, 4];
                for (var i = 0; i < filterTypes.length; i++) {
                    var data = {
                        options: this._textureMapTask.compress,
                        filterType: filterTypes[i],
                        width: textureMap.getWidth(),
                        height: textureMap.getHeight(),
                        textureArray: textureArray
                    };
                    this._clusterQueue.runTask(new Texturer.CompressImageMaster(data, function (error, result) {
                        if (error) {
                            _this._callback(new Error(error), null);
                        }
                        else {
                            var compressedImage = new Buffer(result.compressedPNG);
                            if (bestCompressedImage === null || compressedImage.length < bestCompressedImage.length) {
                                bestCompressedImage = compressedImage;
                            }
                            filterCount++;
                            if (filterCount === filterTypes.length) {
                                _this._onTextureMapImageCompressed(textureMap, bestCompressedImage);
                            }
                        }
                    }));
                }
            };
            TextureMapTaskRunner.prototype._onTextureMapImageCompressed = function (textureMapImage, compressedImage) {
                var _this = this;
                if (this._textureMapTask.compress.tinyPng) {
                    this._clusterQueue.runTask(new Texturer.TinyPngMaster({
                        content: Array.prototype.slice.call(compressedImage, 0),
                        configFile: "./config.json"
                    }, function (error, result) {
                        if (error) {
                            _this._callback(error, null);
                            return;
                        }
                        var compressedImage = new Buffer(result);
                        _this._createDataURI(textureMapImage, compressedImage);
                    }));
                }
                else {
                    this._createDataURI(textureMapImage, compressedImage);
                }
            };
            TextureMapTaskRunner.prototype._createDataURI = function (textureMap, compressedImage) {
                var _this = this;
                var dataURI = null;
                if (this._textureMapTask.dataURI.enable) {
                    dataURI = new Utils.DataURIEncoder().encodeBuffer(compressedImage, "image/png");
                    if (dataURI.length >= this._textureMapTask.dataURI.maxSize) {
                        dataURI = null;
                    }
                }
                textureMap.setDataURI(dataURI);
                var skipFileWrite = dataURI && !this._textureMapTask.dataURI.createImageFileAnyway;
                if (!skipFileWrite) {
                    var file = path.join(this._globalConfig.getFolderRootToIndexHtml(), this._textureMapTask.textureMapFileName), data = {
                        file: file,
                        content: Array.prototype.slice.call(compressedImage, 0)
                    };
                    this._clusterQueue.runTask(new Texturer.WriteFileMaster(data, function (error, result) {
                        if (error) {
                            _this._callback(error, null);
                        }
                        else {
                            _this._callback(null, textureMap);
                        }
                    }));
                }
                else {
                    this._callback(null, textureMap);
                }
            };
            return TextureMapTaskRunner;
        })();
        Utils.TextureMapTaskRunner = TextureMapTaskRunner;
    })(Utils = Texturer.Utils || (Texturer.Utils = {}));
})(Texturer || (Texturer = {}));
///<reference path="../../shared/multitask/types.ts"/>
var Texturer;
(function (Texturer) {
    var CopyFileMaster = (function () {
        function CopyFileMaster(data, callback) {
            this._data = data;
            this._callback = callback;
        }
        CopyFileMaster.prototype.getFile = function () {
            return 'copyFileWorker.js';
        };
        CopyFileMaster.prototype.getWorkerData = function () {
            return this._data;
        };
        CopyFileMaster.prototype.onData = function (error, data) {
            this._callback(error, data);
        };
        return CopyFileMaster;
    })();
    Texturer.CopyFileMaster = CopyFileMaster;
})(Texturer || (Texturer = {}));
///<reference path="../containers/textureMap.ts"/>
///<reference path="../node.d.ts"/>
///<reference path="../config/globalConfig.ts"/>
///<reference path="../multitask/master.ts"/>
///<reference path="../containers/loadedFile.ts"/>
///<reference path="dataURIEncoder.ts"/>
///<reference path="../../texturer/tasks/copyFileMaster.ts"/>
var Texturer;
(function (Texturer) {
    var Utils;
    (function (Utils) {
        var path = require("path"), fs = require("fs");
        var CopyTaskRunner = (function () {
            function CopyTaskRunner(globalConfig, copyTask, loadedFiles, clusterQueue, callback) {
                this._globalConfig = globalConfig;
                this._copyTask = copyTask;
                this._loadedFiles = loadedFiles;
                this._clusterQueue = clusterQueue;
                this._textureMaps = [];
                this._callback = callback;
            }
            CopyTaskRunner.prototype.run = function () {
                var _this = this;
                this._copyTask.files.forEach(function (file) {
                    var fromFile = path.join(_this._globalConfig.getFolderRootFrom(), file), toFile = path.join(_this._globalConfig.getFolderRootToIndexHtml(), file), loadedFile = _this._loadedFiles[file];
                    var dataURI = null;
                    if (_this._copyTask.dataURI.enable) {
                        dataURI = new Utils.DataURIEncoder().encodeFile(fromFile);
                        if (dataURI.length >= _this._copyTask.dataURI.maxSize) {
                            dataURI = null;
                        }
                    }
                    var width = loadedFile.getWidth(), height = loadedFile.getHeight();
                    var textureImage = new Texturer.Containers.TextureImage();
                    textureImage.setData(loadedFile.getRealWidth(), loadedFile.getRealHeight(), loadedFile.getBitmap(), loadedFile.getTrim(), loadedFile.isOpaque());
                    var texture = new Texturer.Containers.Texture();
                    texture.setData(0, 0, width, height);
                    texture.setTextureImage(textureImage);
                    var textureMap = new Texturer.Containers.TextureMap();
                    textureMap.setData(file, width, height, false, false);
                    textureMap.setDataURI(dataURI);
                    textureMap.setTexture(file, texture);
                    var skipFileWrite = dataURI && !_this._copyTask.dataURI.createImageFileAnyway;
                    if (!skipFileWrite) {
                        _this._copyFile(fromFile, toFile, function () {
                            _this._addTextureMap(textureMap);
                        });
                    }
                    else {
                        _this._addTextureMap(textureMap);
                    }
                });
            };
            CopyTaskRunner.prototype._copyFile = function (fromFile, toFile, onCopyFinishedCallback) {
                var _this = this;
                try {
                    Utils.FSHelper.createDirectory(path.dirname(toFile));
                    if (fs.existsSync(toFile)) {
                        fs.chmodSync(toFile, '0777');
                        fs.unlinkSync(toFile);
                    }
                }
                catch (e) {
                    this._callback(new Error("COPY PREPARATION: " + e.toString()), null);
                }
                var copyTask = new Texturer.CopyFileMaster({ source: fromFile, target: toFile }, function (error) {
                    if (error) {
                        _this._callback(new Error("" +
                            "COPY: \n" +
                            "src: " + fromFile + "\n" +
                            "dst: " + toFile + "\n" +
                            "error: " + error), null);
                    }
                    onCopyFinishedCallback();
                });
                this._clusterQueue.runTask(copyTask);
            };
            CopyTaskRunner.prototype._addTextureMap = function (textureMapImage) {
                this._textureMaps.push(textureMapImage);
                if (this._copyTask.files.length === this._textureMaps.length) {
                    this._callback(null, this._textureMaps);
                }
            };
            return CopyTaskRunner;
        })();
        Utils.CopyTaskRunner = CopyTaskRunner;
    })(Utils = Texturer.Utils || (Texturer.Utils = {}));
})(Texturer || (Texturer = {}));
///<reference path="../node.d.ts"/>
///<reference path="fsHelper.ts"/>
var Texturer;
(function (Texturer) {
    var Utils;
    (function (Utils) {
        var fs = require("fs"), path = require("path"), jpegEngine = require("jpeg-js"), bmpEngine = require("bmp-js"), supportedImageExtensions = ["jpg", "jpeg", "png", "bmp"], pngEngine = require("../custom_modules/node-png").PNG;
        var ImageHelper = (function () {
            function ImageHelper() {
            }
            ImageHelper.isImageFileSupported = function (fileName) {
                var isFile = fs.statSync(fileName).isFile();
                return isFile && supportedImageExtensions.indexOf(Utils.FSHelper.getExtension(fileName).toLocaleLowerCase()) >= 0;
            };
            ImageHelper.readImageFile = function (file, callback, thisArg) {
                var textureBmp, textureJpeg, texturePng, fileNameWithoutExt = Utils.FSHelper.getFileNameWithoutExtension(file), testFileNameForJavaScriptIdentifier = /^[(\d+)`~\| !@#\$%\^&\*\(\)\-=\+\?\.,<>]+|[`~\|!@#\$%\^&\*\(\)\-=\+\? \.,<>]/g, i;
                if (testFileNameForJavaScriptIdentifier.test(fileNameWithoutExt)) {
                    callback.call(thisArg, new Error("Incorrect file name " + fileNameWithoutExt + " (file: " + file + ")"), null);
                }
                if (!ImageHelper.isImageFileSupported(file)) {
                    callback.call(thisArg, new Error("Supported files: *." + supportedImageExtensions.join(", *.") + ". File " + file + " is not supported."), null);
                }
                switch (Utils.FSHelper.getExtension(file).toUpperCase()) {
                    case "JPEG":
                    case "JPG":
                        fs.readFile(file, function (error, data) {
                            if (error) {
                                callback.call(thisArg, new Error("FS: Can't read file " + file + ", error: " + error), null);
                                return;
                            }
                            try {
                                textureJpeg = jpegEngine.decode(data);
                            }
                            catch (e) {
                                callback.call(thisArg, new Error("JPG: Can't decode file " + file + ", error: " + e), null);
                                return;
                            }
                            texturePng = new pngEngine({
                                filterType: 0,
                                width: textureJpeg.width,
                                height: textureJpeg.height
                            });
                            for (i = 0; i < textureJpeg.data.length; i += 4) {
                                texturePng.data[i] = textureJpeg.data[i];
                                texturePng.data[i + 1] = textureJpeg.data[i + 1];
                                texturePng.data[i + 2] = textureJpeg.data[i + 2];
                                texturePng.data[i + 3] = textureJpeg.data[i + 3];
                            }
                            callback.call(thisArg, null, texturePng);
                        });
                        break;
                    case "PNG":
                        fs.createReadStream(file)
                            .pipe(new pngEngine({
                            filterType: 0
                        }))
                            .on('parsed', function () {
                            callback.call(thisArg, null, this);
                        })
                            .on('error', function (error) {
                            callback.call(thisArg, new Error("PNG: Can't decode file " + file + ", error: " + error), null);
                        });
                        break;
                    case "BMP":
                        fs.readFile(file, function (error, data) {
                            if (error) {
                                callback.call(thisArg, new Error("File system error: Can't read file " + file + ", error: " + error), null);
                                return;
                            }
                            try {
                                textureBmp = bmpEngine.decode(data);
                            }
                            catch (e) {
                                callback.call(thisArg, new Error("BMP: Can't decode file " + file + ", error: " + e), null);
                                return;
                            }
                            texturePng = new pngEngine({
                                filterType: 0,
                                width: textureBmp.width,
                                height: textureBmp.height
                            });
                            for (i = 0; i < textureBmp.data.length; i += 4) {
                                texturePng.data[i] = textureBmp.data[i + 2];
                                texturePng.data[i + 1] = textureBmp.data[i + 1];
                                texturePng.data[i + 2] = textureBmp.data[i];
                                texturePng.data[i + 3] = textureBmp.data[i + 3];
                            }
                            callback.call(thisArg, null, texturePng);
                        });
                        break;
                }
            };
            ImageHelper.trimImage = function (png, alphaThreshold) {
                var width = png.width, height = png.height, nonTransparentPixelsOpacity = alphaThreshold, left = 0, right = 0, top = 0, bottom = 0, foundNonTransparentPixel, base, x, y;
                for (x = 0, foundNonTransparentPixel = false; x < width; x++, left++) {
                    for (y = 0; y < height; y++) {
                        base = (width * y + x) << 2;
                        if (png.data[base + 3] > nonTransparentPixelsOpacity) {
                            foundNonTransparentPixel = true;
                            break;
                        }
                    }
                    if (foundNonTransparentPixel) {
                        break;
                    }
                }
                for (x = width - 1, foundNonTransparentPixel = false; x >= left; x--, right++) {
                    for (y = 0; y < height; y++) {
                        base = (width * y + x) << 2;
                        if (png.data[base + 3] > nonTransparentPixelsOpacity) {
                            foundNonTransparentPixel = true;
                            break;
                        }
                    }
                    if (foundNonTransparentPixel) {
                        break;
                    }
                }
                for (y = 0, foundNonTransparentPixel = false; y < height; y++, top++) {
                    for (x = 0; x < width; x++) {
                        base = (width * y + x) << 2;
                        if (png.data[base + 3] > nonTransparentPixelsOpacity) {
                            foundNonTransparentPixel = true;
                            break;
                        }
                    }
                    if (foundNonTransparentPixel) {
                        break;
                    }
                }
                for (y = height - 1, foundNonTransparentPixel = false; y >= top; y--, bottom++) {
                    for (x = 0; x < width; x++) {
                        base = (width * y + x) << 2;
                        if (png.data[base + 3] > nonTransparentPixelsOpacity) {
                            foundNonTransparentPixel = true;
                            break;
                        }
                    }
                    if (foundNonTransparentPixel) {
                        break;
                    }
                }
                if (left + right === width) {
                    if (left > 0) {
                        left--;
                    }
                    else {
                        right--;
                    }
                }
                if (top + bottom === height) {
                    if (top > 0) {
                        top--;
                    }
                    else {
                        bottom--;
                    }
                }
                width = width - left - right;
                height = height - top - bottom;
                var texturePng = new pngEngine({
                    filterType: 0,
                    width: width,
                    height: height
                });
                png.bitblt(texturePng, left, top, width, height, 0, 0);
                return {
                    png: texturePng,
                    width: width,
                    height: height,
                    trim: { left: left, right: right, top: top, bottom: bottom }
                };
            };
            ImageHelper.isOpaque = function (png) {
                var width = png.width, height = png.height, base, x, y;
                for (x = 0; x < width; x++) {
                    for (y = 0; y < height; y++) {
                        base = (width * y + x) << 2;
                        if (png.data[base + 3] < 255) {
                            return false;
                        }
                    }
                }
                return true;
            };
            return ImageHelper;
        })();
        Utils.ImageHelper = ImageHelper;
    })(Utils = Texturer.Utils || (Texturer.Utils = {}));
})(Texturer || (Texturer = {}));
/// <reference path='../shared/node.d.ts' />
///<reference path="../shared/utils/fsHelper.ts"/>
///<reference path="../shared/config/globalConfig.ts"/>
///<reference path="../shared/utils/texturePoolWriter.ts"/>
/**
 * @preserve
 *
 * Copyright (c) 2014-2015 Igor Bezkrovny
 * @license MIT
 *
 * LICENSE TEXT: {@link https://github.com/igor-bezkrovny/texturer/blob/master/LICENSE}
 */
/// <reference path='../shared/containers/textureMap.ts' />
/// <reference path='../shared/containers/loadedFile.ts' />
///<reference path="../shared/utils/dataURIEncoder.ts"/>
///<reference path="../shared/utils/textureMapTaskRunner.ts"/>
///<reference path="../shared/utils/copyTaskRunner.ts"/>
///<reference path="../shared/utils/imageHelper.ts"/>
///<reference path="../shared/multitask/types.ts"/>
///<reference path="../shared/multitask/master.ts"/>
///<reference path="tasks/binPackerMaster.ts"/>
///<reference path="tasks/compressImageMaster.ts"/>
///<reference path="tasks/writeFileMaster.ts"/>
///<reference path="tasks/copyFileMaster.ts"/>
///<reference path="tasks/tinyPngMaster.ts"/>
/// <reference path='textureMapGenerator.ts' />
var Texturer;
(function (Texturer_1) {
    var fs = require("fs"), path = require('path'), util = require('util'), _startTime = Date.now();
    var Texturer = (function () {
        function Texturer() {
            this._cq = new MultiTask.Master(__dirname + "/tasks");
        }
        Texturer.prototype.generate = function (config, callback) {
            this._cq.restart();
            this._callback = callback;
            try {
                this._configParser = new Texturer_1.Config.GlobalConfig(config);
                this._textureMapArray = [];
                this._loadedFiles = {};
                this._loadedFilesCount = 0;
                this._totalFilesCount = 0;
                this._totalTexturMapsRequiredCount = 0;
                this._loadFiles();
            }
            catch (e) {
                this._shutdown(e);
            }
        };
        Texturer.prototype._loadFiles = function () {
            var _this = this;
            this._configParser.copyTasks.forEach(function (copyTask) {
                _this._totalFilesCount += copyTask.files.length;
                _this._totalTexturMapsRequiredCount += copyTask.files.length;
            });
            this._configParser.textureMapTasks.forEach(function (textureMapTask) {
                _this._totalFilesCount += textureMapTask.files.length;
                _this._totalTexturMapsRequiredCount++;
            });
            this._configParser.copyTasks.forEach(function (copyTask) {
                _this._loadFilesForTextureMap(copyTask.files, false, 0);
            });
            this._configParser.textureMapTasks.forEach(function (textureMapTask) {
                _this._loadFilesForTextureMap(textureMapTask.files, textureMapTask.trim.enable, textureMapTask.trim.alpha);
            });
        };
        Texturer.prototype._loadFilesForTextureMap = function (files, doTrim, alphaThreshold) {
            var _this = this;
            files.forEach(function (file) {
                Texturer_1.Utils.ImageHelper.readImageFile(path.join(_this._configParser.getFolderRootFrom(), file), function (error, instance) {
                    if (error) {
                        _this._shutdown(error);
                    }
                    else {
                        var trim = { left: 0, right: 0, top: 0, bottom: 0 }, realWidth = instance.width, realHeight = instance.height;
                        if (doTrim) {
                            var trimResult = Texturer_1.Utils.ImageHelper.trimImage(instance, alphaThreshold);
                            instance = trimResult.png;
                            trim = trimResult.trim;
                        }
                        _this._loadedFiles[file] = new Texturer_1.Containers.LoadedFile(instance.width, instance.height, realWidth, realHeight, Texturer_1.Utils.ImageHelper.isOpaque(instance), trim, instance.data);
                        _this._loadedFilesCount++;
                        if (_this._totalFilesCount === _this._loadedFilesCount) {
                            logMemory("files loaded: " + _this._totalFilesCount);
                            _this._generateTextureMaps();
                        }
                    }
                });
            });
        };
        Texturer.prototype._generateTextureMaps = function () {
            this._configParser.copyTasks.forEach(this._runCopyTask, this);
            this._configParser.textureMapTasks.forEach(this._runTextureMapTask, this);
        };
        Texturer.prototype._runCopyTask = function (copyTask) {
            var _this = this;
            var runner = new Texturer_1.Utils.CopyTaskRunner(this._configParser, copyTask, this._loadedFiles, this._cq, function (error, textureMaps) {
                if (error) {
                    _this._shutdown(error);
                }
                else {
                    _this._onTextureMapGenerated(textureMaps);
                }
            });
            runner.run();
        };
        Texturer.prototype._runTextureMapTask = function (textureMapTask) {
            var _this = this;
            var runner = new Texturer_1.Utils.TextureMapTaskRunner(this._configParser, textureMapTask, this._loadedFiles, this._cq, function (error, textureMap) {
                if (error) {
                    _this._shutdown(error);
                }
                else {
                    _this._onTextureMapGenerated([textureMap]);
                }
            });
            runner.run();
        };
        Texturer.prototype._onTextureMapGenerated = function (textureMaps) {
            for (var _i = 0; _i < textureMaps.length; _i++) {
                var textureMap = textureMaps[_i];
                this._textureMapArray.push(textureMap);
            }
            if (this._textureMapArray.length === this._totalTexturMapsRequiredCount) {
                logMemory('build time: ' + (Date.now() - _startTime) + ' ms');
                var duplicateFileNamesArray = new Texturer_1.Utils.TexturePoolWriter().writeTexturePoolFile(this._configParser.getFolderRootTo(), this._configParser, this._loadedFiles, this._textureMapArray);
                this._shutdown(duplicateFileNamesArray.length > 0 ? new Error("Found duplicate file names:\n" + duplicateFileNamesArray.join("\n")) : null);
            }
        };
        Texturer.prototype._shutdown = function (error) {
            var _this = this;
            if (error) {
                this._cq.abort();
                this._callback(error);
            }
            else {
                this._cq.shutdown(function () {
                    _this._callback(null);
                });
            }
        };
        return Texturer;
    })();
    Texturer_1.Texturer = Texturer;
    var __logMemoryUsage = process.memoryUsage();
    function logMemory(title) {
        console.log(title + "\nheapUsed: " + (process.memoryUsage().heapUsed - __logMemoryUsage.heapUsed + ", heapTotal: " + process.memoryUsage().heapTotal));
    }
})(Texturer || (Texturer = {}));
module.exports = Texturer.Texturer;
//# sourceMappingURL=texturer.js.map