/// <reference path='../typings/node.d.ts' />
/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */
var fs = require("fs"), path = require("path");
var pngModule = require("../modules/node-png");
var jpegEngine = require("jpeg-js");
var bmpEngine = require("./modules/bmp-js");
var supportedImageExtensions = ["jpg", "jpeg", "png", "bmp"], pngEngine = pngModule.PNG;
var Texturer;
(function (Texturer) {
    function _exportTexturePoolViaHandlebarsTemplate(configParser, file, folder, data) {
        var Handlebars = require("Handlebars");
        if (Texturer.helper.getExtension(file).toLowerCase() === "hbs") {
            var text = fs.readFileSync(path.join(folder, file), 'utf8');
            if (text && text.length > 0) {
                text = text.replace(/\r/g, "");
                var lines = text.split("\n"), template;
                if (lines.length > 1 && lines[0]) {
                    var resultFile = path.join(configParser.getFolderRootTo(), lines[0]);
                    text = lines.slice(1).join("\n");
                    template = Handlebars.compile(text);
                    if (template) {
                        Texturer.helper.createDirectory(path.dirname(resultFile));
                        fs.writeFileSync(resultFile, template(data));
                    }
                    else {
                        console.log("template error in " + resultFile);
                    }
                }
            }
        }
    }
    Texturer.helper = {
        getFileNameWithoutExtension: function (fileName) {
            fileName = path.basename(fileName);
            var index = fileName.lastIndexOf('.');
            return (index < 0) ? fileName : fileName.substr(0, index);
        },
        getExtension: function (fileName) {
            var index = fileName.lastIndexOf('.');
            return (index < 0) ? '' : fileName.substr(index + 1);
        },
        isImageFileSupported: function (fileName) {
            var isFile = fs.statSync(fileName).isFile();
            return isFile && supportedImageExtensions.indexOf(Texturer.helper.getExtension(fileName).toLocaleLowerCase()) >= 0;
        },
        readImageFile: function (file, callback, thisArg) {
            var textureBmp, textureJpeg, texturePng, fileNameWithoutExt = Texturer.helper.getFileNameWithoutExtension(file), testFileNameForJavaScriptIdentifier = /^[(\d+)`~\| !@#\$%\^&\*\(\)\-=\+\?\.,<>]+|[`~\|!@#\$%\^&\*\(\)\-=\+\? \.,<>]/g, i;
            if (testFileNameForJavaScriptIdentifier.test(fileNameWithoutExt)) {
                callback.call(thisArg, new Error("Incorrect file name " + fileNameWithoutExt + " (file: " + file + ")"), null);
            }
            if (!Texturer.helper.isImageFileSupported(file)) {
                callback.call(thisArg, new Error("Supported files: *." + supportedImageExtensions.join(", *.") + ". File " + file + " is not supported."), null);
            }
            switch (Texturer.helper.getExtension(file).toUpperCase()) {
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
                        // create png
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
                    fs.createReadStream(file).pipe(new pngEngine({
                        filterType: 0
                    })).on('parsed', function () {
                        callback.call(thisArg, null, this);
                    }).on('error', function (error) {
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
                        // create png
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
        },
        trimImage: function (png) {
            var width = png.width, height = png.height, nonTransparentPixelsOpacity = 1, left = 0, right = 0, top = 0, bottom = 0, foundNonTransparentPixel, base, x, y;
            for (x = 0, foundNonTransparentPixel = false; x < width; x++, left++) {
                for (y = 0; y < height; y++) {
                    base = (width * y + x) << 2;
                    if (png.data[base + 3] >= nonTransparentPixelsOpacity) {
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
                    if (png.data[base + 3] >= nonTransparentPixelsOpacity) {
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
                    if (png.data[base + 3] >= nonTransparentPixelsOpacity) {
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
                    if (png.data[base + 3] >= nonTransparentPixelsOpacity) {
                        foundNonTransparentPixel = true;
                        break;
                    }
                }
                if (foundNonTransparentPixel) {
                    break;
                }
            }
            // fix: if we have empty image - we should made width at least 1 px
            if (left + right === width) {
                if (left > 0) {
                    left--;
                }
                else {
                    right--;
                }
            }
            // fix: if we have empty image - we should made height at least 1 px
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
            // create png
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
        },
        isOpaque: function (png) {
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
        },
        writeTexturePoolFile: function (configParser, loadedFilesDictionary, TextureMapArray, onError) {
            var templateTexturesArray = [], templateMapsArray = [], usedPixels = 0, trimmedPixels = 0;
            // for each Texture Map
            TextureMapArray.forEach(function (map, mapIndex) {
                var url = path.join(configParser.getFolderImagesServer(), map.getValue("file")).replace(/\\/g, "/"), base64 = map.getValue("base64"), textures = map.getValue("textures"), isLastTextureMap = mapIndex + 1 === TextureMapArray.length;
                //console.log("map.textureMapImage = " + map.textureMapImage);
                templateMapsArray.push({
                    "url": url,
                    "base64": base64,
                    "is-last-item": isLastTextureMap,
                    "width": map.getValue("width"),
                    "height": map.getValue("height"),
                    "repeat-x": map.getValue("repeat-x"),
                    "repeat-y": map.getValue("repeat-y")
                });
                // for each Texture
                textures.forEach(function (texture, textureIndex) {
                    var loadedFileDictionary = loadedFilesDictionary.getValue(texture.id), trim = loadedFileDictionary.getValue("trim"), isLastTexture = textureIndex + 1 === textures.length;
                    usedPixels += texture.width * texture.height;
                    trimmedPixels += (trim.left + trim.right) * (trim.top + trim.bottom);
                    templateTexturesArray.push({
                        //							"css-id"    : this.getFileNameWithoutExtension(texture.id).replace(/^[(\d+)`~\| !@#\$%\^&\*\(\)\-=\+\?\.,<>]+|[`~\|!@#\$%\^&\*\(\)\-=\+\? \.,<>]/g, ""),
                        "id": Texturer.helper.getFileNameWithoutExtension(texture.id),
                        "file": texture.id,
                        "map-index": mapIndex,
                        "url": url,
                        "base64": base64,
                        "x": texture.x,
                        "y": texture.y,
                        "width": texture.width,
                        "height": texture.height,
                        "real-width": loadedFileDictionary.getValue("realWidth"),
                        "real-height": loadedFileDictionary.getValue("realHeight"),
                        "trim": trim,
                        "opaque": loadedFileDictionary.getValue("opaque"),
                        "repeat-x": map.getValue("repeat-x"),
                        "repeat-y": map.getValue("repeat-y"),
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
                textures: templateTexturesArray,
                nameSpace: configParser.getNameSpace()
            };
            var folder = path.join(__dirname, "templates"), files = fs.readdirSync(folder);
            files.forEach(function (file) {
                _exportTexturePoolViaHandlebarsTemplate(configParser, file, folder, data);
            });
            return duplicateFileNamesArray;
        },
        createDirectory: function (dir) {
            var folders = path.normalize(dir).replace(/\\/g, "/").split("/");
            if (folders && folders.length > 0) {
                for (var i = 0; i < folders.length; i++) {
                    var testDir = folders.slice(0, i + 1).join("/");
                    if (!fs.existsSync(testDir)) {
                        fs.mkdirSync(testDir);
                    }
                }
            }
        },
        checkDirectoryExistsSync: function (dir) {
            // check that folder exists
            if (!fs.existsSync(dir)) {
                throw new Error("FS: Folder doesn't exist: " + dir);
            }
            else if (!fs.statSync(dir).isDirectory()) {
                throw new Error("FS: " + dir + " is not a folder");
            }
        },
        formatString: function (format, data) {
            if (!!data && typeof data === 'object') {
                return format.replace(/\{([\s\S]+?)\}/g, function (match, id) {
                    return typeof data[id] !== 'undefined' ? '' + data[id] : match;
                });
            }
            else {
                return '[template error: arg1 = null]';
            }
        },
        extend: function (target) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var TYPE_OBJECT = '[object Object]';
            var TYPE_STRING = '[object String]';
            var TYPE_ARRAY = '[object Array]';
            var result = null;
            for (var i = 0; i < args.length; i++) {
                var toMerge = args[i], keys = Object.keys(toMerge);
                if (result === null) {
                    result = JSON.parse(JSON.stringify(toMerge));
                    continue;
                }
                for (var j = 0; j < keys.length; j++) {
                    var keyName = keys[j];
                    var value = toMerge[keyName];
                    if (Object.prototype.toString.call(value) == TYPE_OBJECT) {
                        if (result[keyName] === undefined) {
                            result[keyName] = {};
                        }
                        result[keyName] = Texturer.helper.extend(result[keyName], value);
                    }
                    else if (Object.prototype.toString.call(value) == TYPE_ARRAY) {
                        if (result[keyName] === undefined) {
                            result[keyName] = [];
                        }
                        result[keyName] = value.concat(result[keyName]);
                    }
                    else {
                        result[keyName] = value;
                    }
                }
            }
            return result;
        },
        getFilesInFolder: function (folder, filter, recursive, subFolder) {
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
                        files = files.concat(Texturer.helper.getFilesInFolder(folder, filter, recursive, subFolderFileName));
                    }
                }
            });
            return files.map(function (file) {
                return file.replace(/\\/g, "/");
            });
        },
        getFoldersInFolder: function (folder, filter, recursive, subFolder) {
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
                        folders = folders.concat(Texturer.helper.getFilesInFolder(folder, filter, recursive, subFolderFileName));
                    }
                }
            });
            return folders.map(function (folder) {
                return folder.replace(/\\/g, "/");
            });
        }
    };
})(Texturer || (Texturer = {}));
var Texturer;
(function (Texturer) {
    var Dictionary = (function () {
        function Dictionary(serializedData) {
            this._data = {};
            if (typeof serializedData !== 'undefined') {
                this._deserialize(serializedData);
            }
        }
        Dictionary.prototype.setValue = function (key, value) {
            this._data[key] = value;
        };
        Dictionary.prototype.getValue = function (key) {
            return this._data[key];
        };
        Dictionary.prototype.addValue = function (key, value) {
            if (this.hasKey(key)) {
                this.getValue(key).push(value);
            }
            else {
                this.setValue(key, [value]);
            }
        };
        Dictionary.prototype.hasKey = function (key) {
            return key in this._data;
        };
        /**
         * @param {function(this:T, value: VALUE_TYPE, key: string, dictionary : Object.<string, VALUE_TYPE>)} callback
         * @param {T} thisArg
         * @template T, VALUE_TYPE
         */
        Dictionary.prototype.forEach = function (callback, thisArg) {
            for (var i in this._data) {
                if (this._data.hasOwnProperty(i)) {
                    callback.call(thisArg, this._data[i], i, this._data);
                }
            }
        };
        Dictionary.prototype.getSerialized = function () {
            return JSON.stringify(this._data);
        };
        Dictionary.prototype._deserialize = function (data) {
            this._data = JSON.parse(data);
        };
        return Dictionary;
    })();
    Texturer.Dictionary = Dictionary;
})(Texturer || (Texturer = {}));
/// <reference path='./dictionary.ts' />
/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */
var path = require("path");
/*
cluster.setupMaster({
    exec : path.resolve(__dirname, "../binPacker", "tasks.js")
});
*/
var Texturer;
(function (Texturer) {
    var TextureMapGenerator = (function () {
        function TextureMapGenerator(cq) {
            this._cq = cq;
        }
        TextureMapGenerator.prototype.generateTextureMap = function (files, textureMapConfig, callback, thisArg) {
            try {
                // calculate total pixels
                var totalPixels = 0;
                files.forEach(function (file) {
                    totalPixels += file.width * file.height;
                });
                this._plannedPlaceFilesTests = 3 + textureMapConfig.getNPass();
                this._finishedPlaceFilesTests = 0;
                this._textureMap = null;
                this._callback = callback;
                this._thisArg = thisArg;
                this._totalPixels = totalPixels;
                // try different combinations
                this._placeFiles(textureMapConfig, files.sort(function (a, b) {
                    return (b.width * b.height - a.width * a.height) || (b.id > a.id ? 1 : -1);
                }));
                this._placeFiles(textureMapConfig, files.sort(function (a, b) {
                    return (b.width - a.width) || (b.id > a.id ? 1 : -1);
                }));
                this._placeFiles(textureMapConfig, files.sort(function (a, b) {
                    return (b.height - a.height) || (b.id > a.id ? 1 : -1);
                }));
                for (var i = 0; i < textureMapConfig.getNPass(); i++) {
                    this._placeFiles(textureMapConfig, this._getShuffledArray(files));
                }
            }
            catch (e) {
                callback.call(thisArg, e.stack, null);
            }
        };
        TextureMapGenerator.prototype._onPlaceFilesFinished = function (error, bestTextureMapDictionary) {
            if (!error && bestTextureMapDictionary) {
                if (this._textureMap === null || bestTextureMapDictionary.getValue("area") < this._textureMap.getValue("area")) {
                    this._textureMap = bestTextureMapDictionary;
                }
            }
            this._finishedPlaceFilesTests++;
            //process.stdout.write("placeFilesTests: " + this._finishedPlaceFilesTests + " of " + this._plannedPlaceFilesTests + "\033[0G");
            if (this._finishedPlaceFilesTests === this._plannedPlaceFilesTests) {
                if (this._textureMap && this._textureMap.getValue("area") > 0) {
                    this._callback.call(this._thisArg, null, this._textureMap);
                }
                else {
                    this._callback.call(this._thisArg, null, null);
                }
            }
        };
        TextureMapGenerator.prototype._placeFiles = function (textureMapConfig, files) {
            var targetSpriteWidth = null, targetSpriteHeight = null;
            if (textureMapConfig.getRepeatX() && textureMapConfig.getRepeatY()) {
                throw "sprite can't be repeat-x and repeat-y at the same time";
            }
            if (textureMapConfig.getRepeatX()) {
                targetSpriteWidth = files[0].width;
                files.forEach(function (file) {
                    if (file.width !== targetSpriteWidth) {
                        throw "all images should have the same width to repeat by X axis";
                    }
                });
            }
            if (textureMapConfig.getRepeatY()) {
                targetSpriteHeight = files[0].height;
                files.forEach(function (file) {
                    if (file.height !== targetSpriteHeight) {
                        throw "all images should have the same width to repeat by Y axis";
                    }
                });
            }
            var fromX = targetSpriteWidth || 4, toX = targetSpriteWidth || 1920, fromY = targetSpriteHeight || 4, toY = targetSpriteHeight || 1080;
            var data = {
                fromX: fromX,
                toX: toX,
                fromY: fromY,
                toY: toY,
                totalPixels: this._totalPixels,
                files: files,
                /*
                 isRepeatX   : textureMapConfig.getRepeatX(),
                 isRepeatY   : textureMapConfig.getRepeatY(),
                 */
                gridStep: textureMapConfig.getGridStep()
            };
            this._cq.runTask("binPacker", data, function (error, result) {
                if (error) {
                    this._onPlaceFilesFinished(error, null);
                }
                else {
                    if (result) {
                        var map = new Texturer.Dictionary(result);
                        map.setValue("repeat-x", textureMapConfig.getRepeatX());
                        map.setValue("repeat-y", textureMapConfig.getRepeatY());
                        /*
                         map.getValue("textures").forEach(function(texture, index, textures) {
                         //textures[index] = new Dictionary(texture);
                         });
                         */
                        this._onPlaceFilesFinished(null, map);
                    }
                    else {
                        this._onPlaceFilesFinished(null, null);
                    }
                }
            }, this);
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
        return TextureMapGenerator;
    })();
    Texturer.TextureMapGenerator = TextureMapGenerator;
})(Texturer || (Texturer = {}));
/// <reference path='./helper' />
/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */
var fs = require("fs"), path = require("path");
var Texturer;
(function (Texturer) {
    var TextureMapConfig = (function () {
        function TextureMapConfig(configParser, resourceTextureMapConfig) {
            var folder = resourceTextureMapConfig["folder(in)"], fromFolder = configParser.getFolderFrom(), rootFolder = configParser.getFolderRoot(), fullFolder = path.join(rootFolder, fromFolder, folder);
            Texturer.helper.checkDirectoryExistsSync(fullFolder);
            var regex = configParser.getFileAndFolderNameIgnoreRegEx() ? new RegExp(configParser.getFileAndFolderNameIgnoreRegEx(), "gi") : null, filter = regex ? function (name) {
                regex.lastIndex = 0;
                return regex.test(name);
            } : null;
            var files = Texturer.helper.getFilesInFolder(fullFolder, filter, true).map(function (file) {
                return path.join(folder, file).replace(/\\/g, "/");
            });
            if (files.length <= 0) {
                throw "no files in fullfolder " + folder;
            }
            this._configParser = configParser;
            this._files = files;
            this._folder = folder;
            this._copy = typeof resourceTextureMapConfig["copy"] === 'boolean' ? resourceTextureMapConfig["copy"] : false;
            this._base64 = typeof resourceTextureMapConfig["base64"] === 'boolean' ? resourceTextureMapConfig["base64"] : this._configParser.encodeDataURI();
            this._pngOptions = typeof resourceTextureMapConfig["compression"] !== 'undefined' ? resourceTextureMapConfig["compression"] : {};
            this._gridStep = typeof resourceTextureMapConfig["grid-step"] === 'number' ? resourceTextureMapConfig["grid-step"] : 0;
            // in case we are copying files - do there will be no transforms
            if (this._copy) {
                this._pngFileName = null;
                this._repeatX = false;
                this._repeatY = false;
                this._nPass = 0;
            }
            else {
                this._pngFileName = resourceTextureMapConfig["texture-map(out)"];
                this._repeatX = typeof resourceTextureMapConfig["repeat-x"] === 'boolean' ? resourceTextureMapConfig["repeat-x"] : false;
                this._repeatY = typeof resourceTextureMapConfig["repeat-y"] === 'boolean' ? resourceTextureMapConfig["repeat-y"] : false;
                this._nPass = typeof resourceTextureMapConfig["n-pass"] === 'number' ? resourceTextureMapConfig["n-pass"] : 0;
            }
        }
        TextureMapConfig.prototype.getFiles = function () {
            return this._files;
        };
        TextureMapConfig.prototype.getFolder = function () {
            return this._folder;
        };
        TextureMapConfig.prototype.getPNGFileName = function () {
            return this._pngFileName;
        };
        TextureMapConfig.prototype.getRepeatX = function () {
            return this._repeatX;
        };
        TextureMapConfig.prototype.getRepeatY = function () {
            return this._repeatY;
        };
        TextureMapConfig.prototype.getNPass = function () {
            return this._nPass;
        };
        TextureMapConfig.prototype.getJustCopy = function () {
            return this._copy;
        };
        TextureMapConfig.prototype.encodeDataURI = function () {
            return this._base64;
        };
        TextureMapConfig.prototype.getCompressionOptions = function () {
            return Texturer.helper.extend(this._configParser.getCompressionOptions(), this._pngOptions);
        };
        TextureMapConfig.prototype.getGridStep = function () {
            return this._gridStep;
        };
        return TextureMapConfig;
    })();
    Texturer.TextureMapConfig = TextureMapConfig;
})(Texturer || (Texturer = {}));
/// <reference path='../typings/node.d.ts' />
/// <reference path='./helper' />
/// <reference path='./textureMapGenerator.ts' />
/// <reference path='./textureMapConfig' />
var fs = require("fs"), path = require("path");
var Texturer;
(function (Texturer) {
    /*
     * Project: Texturer
     *
     * User: Igor Bezkrovny
     * Date: 18.10.2014
     * Time: 19:36
     * MIT LICENSE
     */
    var ConfigParser = (function () {
        function ConfigParser(configJSON) {
            try {
                // eval is used to allow comments inside json
                var _config = eval('(' + configJSON + ')');
            }
            catch (e) {
                throw new Error("Config JSON invalid: \"" + e + "\n");
            }
            this._textureMapConfigArray = [];
            this._folders = null;
            this._parse(_config);
        }
        ConfigParser.prototype._parse = function (config) {
            this._folders = {
                root: process.cwd(),
                from: config["folders"]["source(in)"],
                to: config["folders"]["target(out)"]
            };
            Texturer.helper.createDirectory(this.getFolderRootToImagesServer());
            this._config["tasks"].forEach(function (resourceTextureMapConfig) {
                this._textureMapConfigArray.push(new Texturer.TextureMapConfig(this, resourceTextureMapConfig));
            }, this);
        };
        ConfigParser.prototype.getFolderRootFrom = function () {
            return path.join(this.getFolderRoot(), this.getFolderFrom());
        };
        ConfigParser.prototype.getFolderRootTo = function () {
            return path.join(this.getFolderRoot(), this.getFolderTo());
        };
        ConfigParser.prototype.getFolderRootToImagesServer = function () {
            return path.join(this.getFolderRoot(), this.getFolderTo(), this.getFolderImagesServer());
        };
        ConfigParser.prototype.getFolderRoot = function () {
            return this._folders.root;
        };
        ConfigParser.prototype.getFolderFrom = function () {
            return this._folders.from;
        };
        ConfigParser.prototype.getFolderTo = function () {
            return this._folders.to;
        };
        ConfigParser.prototype.getTextureMapConfigArray = function () {
            return this._textureMapConfigArray;
        };
        ConfigParser.prototype.getFolderImagesServer = function () {
            return this._config["folders"]["images(index.html)"];
        };
        ConfigParser.prototype.getNameSpace = function () {
            return this._config["nameSpace"];
        };
        ConfigParser.prototype.encodeDataURI = function () {
            return typeof this._config["base64"] === 'boolean' ? this._config["base64"] : false;
        };
        ConfigParser.prototype.getCompressionOptions = function () {
            return typeof this._config["compression"] !== 'undefined' ? this._config["compression"] : {};
        };
        ConfigParser.prototype.getFileAndFolderNameIgnoreRegEx = function () {
            return (typeof this._config["filter"] === 'string' && this._config["filter"].length > 0) ? this._config["filter"] : null;
        };
        return ConfigParser;
    })();
    Texturer.ConfigParser = ConfigParser;
})(Texturer || (Texturer = {}));
var a = new Texturer.ConfigParser("xxx");
//# sourceMappingURL=config.js.map