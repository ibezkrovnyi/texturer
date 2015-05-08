/// <reference path='./typings/node.d.ts' />
/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */
var fs = require("fs"), path = require("path");
var pngModule = require("./modules/node-png");
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
                        // read bmp
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
                        // convert data from jpg_plugin (rgb) to png_plugin (rgb)
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
                        // read bmp
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
                        // convert data from bmp_plugin (bgr) to png_plugin (rgb)
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
            // from left
            for (x = 0, foundNonTransparentPixel = false; x < width; x++, left++) {
                // vertical test
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
            // from right
            for (x = width - 1, foundNonTransparentPixel = false; x >= left; x--, right++) {
                // vertical test
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
            // from top
            for (y = 0, foundNonTransparentPixel = false; y < height; y++, top++) {
                // vertical test
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
            // from bottom
            for (y = height - 1, foundNonTransparentPixel = false; y >= top; y--, bottom++) {
                // vertical test
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
            // from left
            for (x = 0; x < width; x++) {
                // vertical test
                for (y = 0; y < height; y++) {
                    base = (width * y + x) << 2;
                    if (png.data[base + 3] < 255) {
                        return false;
                    }
                }
            }
            return true;
        },
        writeTexturePoolFile: function (configParser, loadedFilesDictionary, TextureMapArray) {
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
/// <reference path='./typings/node.d.ts' />
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
                this._config = eval('(' + configJSON + ')');
            }
            catch (e) {
                throw new Error("Config JSON invalid: \"" + e + "\n");
            }
            this._textureMapConfigArray = [];
            this._folders = null;
            this._parse();
        }
        ConfigParser.prototype._parse = function () {
            this._folders = {
                root: process.cwd(),
                from: this._config["folders"]["source(in)"],
                to: this._config["folders"]["target(out)"]
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
/// <reference path='./typings/node.d.ts' />
var ClusterQueue;
(function (ClusterQueue) {
    var cluster = require("cluster"), os = require('os');
    var WorkerDescription = (function () {
        function WorkerDescription(callback, thisArg) {
            var _this = this;
            this._task = null;
            this._online = false;
            this._worker = cluster.fork();
            this._worker.on("message", function (data) {
                var task = _this._task;
                if (task !== null) {
                    _this._task = null;
                    // on error kill worker
                    if (data.error) {
                        _this.kill();
                    }
                    callback.call(thisArg, _this, task, data.error, data.taskResult);
                }
            });
            this._worker.on("online", function (worker) {
                // timeout is for debugging in JetBrains WebStorm. When running from command line, no delay is needed
                setTimeout(function () {
                    _this._online = true;
                    if (_this._task) {
                        _this._startTask();
                    }
                }, 500);
            });
            this._worker.on("exit", function (worker, code, signal) {
                if (_this._worker) {
                    var task = _this._task;
                    if (task !== null) {
                        _this._task = null;
                        callback.call(thisArg, _this, task, new Error("MP: worker died. restarting..."), null);
                    }
                    _this._online = false;
                    _this._worker = null;
                }
            });
        }
        WorkerDescription.prototype.send = function (task) {
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
        WorkerDescription.prototype.kill = function () {
            var worker = this._worker;
            if (worker) {
                this._online = false;
                this._worker = null;
                worker.kill();
            }
        };
        WorkerDescription.prototype._startTask = function () {
            this._worker.send(this._task.data);
        };
        return WorkerDescription;
    })();
    var Master = (function () {
        function Master(options) {
            if (Master._instance !== null) {
                return Master._instance;
            }
            Master._instance = this;
            cluster.setupMaster({
                exec: options.file,
                silent: true // due to bug in node-webkit implementation silent=true is needed
            });
            this._shutdown = { callback: null, thisArg: null, scheduled: false };
            this._tasks = null;
            this._availableWorkerDescriptors = null;
            this._busyWorkerDescriptors = null;
            this._maxSimultaneousTasks = options.maxSimultaneousTasks || ((os.cpus().length * 1.5) | 0);
            this.restart();
        }
        Master.prototype.restart = function () {
            this._availableWorkerDescriptors = [];
            this._busyWorkerDescriptors = [];
            this._tasks = [];
            while (this._availableWorkerDescriptors.length < this._maxSimultaneousTasks) {
                this._availableWorkerDescriptors.push(new WorkerDescription(this._onMessage, this));
            }
        };
        Master.prototype.runTask = function (taskName, taskData, callback, thisArg) {
            // if worker not found - add to tasks
            this._tasks.push({
                callback: callback,
                thisArg: thisArg,
                data: { taskData: taskData, taskName: taskName }
            });
            this._tryToRunTask();
        };
        Master.prototype.shutdown = function (callback, thisArg) {
            this._shutdown.callback = callback;
            this._shutdown.thisArg = thisArg;
            this._shutdown.scheduled = true;
            this._tryToShutdown();
        };
        Master.prototype.abort = function () {
            // kill all available
            this._availableWorkerDescriptors.forEach(function (workerDescriptor) {
                workerDescriptor.kill();
            });
            this._availableWorkerDescriptors = null;
            // kill all busy too - we are aborting!
            this._busyWorkerDescriptors.forEach(function (workerDescriptor) {
                workerDescriptor.kill();
            });
            this._busyWorkerDescriptors = null;
        };
        Master.prototype._tryToShutdown = function () {
            if (this._tasks.length === 0 && this._busyWorkerDescriptors.length === 0) {
                this._availableWorkerDescriptors.forEach(function (workerDescriptor) {
                    workerDescriptor.kill();
                });
                this._availableWorkerDescriptors = null;
                this._busyWorkerDescriptors = null;
                this._tasks = null;
                if (this._shutdown.callback) {
                    this._shutdown.callback.call(this._shutdown.thisArg);
                    this._shutdown.callback = null;
                    this._shutdown.thisArg = null;
                    this._shutdown.scheduled = false;
                }
            }
        };
        Master.prototype._tryToRunTask = function () {
            if (this._tasks.length > 0) {
                var workerDescriptor = this._getAvailableWorkerDescriptor();
                if (workerDescriptor) {
                    this._busyWorkerDescriptors.push(workerDescriptor);
                    workerDescriptor.send(this._tasks.shift());
                }
            }
        };
        Master.prototype._onMessage = function (workerDescriptor, task, error, taskResult) {
            var index = this._busyWorkerDescriptors.indexOf(workerDescriptor);
            if (index >= 0) {
                // reuse worker only if there was no error!
                if (!error) {
                    this._availableWorkerDescriptors.push(this._busyWorkerDescriptors.splice(index, 1)[0]);
                }
                else {
                    this._availableWorkerDescriptors.push(new WorkerDescription(this._onMessage, this));
                }
            }
            else {
                console.log("ERROR: workerDescriptor not found in busy list. Very strange!");
            }
            if (this._tasks.length > 0) {
                this._tryToRunTask();
            }
            else if (this._shutdown.scheduled) {
                this._tryToShutdown();
            }
            if (task.callback) {
                // callback may call shutdown, which will set busyWorkers to null,
                // so this line should the last in _onMessage method
                task.callback.call(task.thisArg, error, taskResult);
            }
        };
        Master.prototype._getAvailableWorkerDescriptor = function () {
            if (this._availableWorkerDescriptors.length === 0) {
                if (this._busyWorkerDescriptors.length < this._maxSimultaneousTasks) {
                    this._availableWorkerDescriptors.push(new WorkerDescription(this._onMessage, this));
                }
            }
            return this._availableWorkerDescriptors.pop();
        };
        Master._instance = null;
        return Master;
    })();
    ClusterQueue.Master = Master;
})(ClusterQueue || (ClusterQueue = {}));
/// <reference path='./helper.ts' />
/// <reference path='./config.ts' />
/// <reference path='./dictionary.ts' />
/// <reference path='./textureMapGenerator.ts' />
/// <reference path='./clusterMaster.ts' />
/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */
var Texturer;
(function (Texturer_1) {
    var fs = require("fs"), path = require('path'), util = require('util'), _startTime = Date.now();
    var Texturer = (function () {
        function Texturer() {
            this._cq = new ClusterQueue.Master({
                file: path.resolve(__dirname, "_tasks.js")
            });
        }
        /**
         * @param configJSONString
         * @param {function(this:T) : string|null } callback Returns null if success, or error text in case error occurred
         * @param {T} thisArg
         * @template T
         */
        Texturer.prototype.generate = function (configJSONString, callback, thisArg) {
            this._cq.restart();
            this._callback = callback;
            this._thisArg = thisArg;
            try {
                this._configParser = new Texturer_1.ConfigParser(configJSONString);
                this._textureMapArray = [];
                //this._loadedFileDataDictionary = {};
                this._loadedFilesDictionary = new Texturer_1.Dictionary();
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
            this._configParser.getTextureMapConfigArray().forEach(function (textureMapConfig) {
                this._totalFilesCount += textureMapConfig.getFiles().length;
                if (textureMapConfig.getJustCopy()) {
                    this._totalTexturMapsRequiredCount += textureMapConfig.getFiles().length;
                }
                else {
                    this._totalTexturMapsRequiredCount++;
                }
            }, this);
            this._configParser.getTextureMapConfigArray().forEach(this._loadFilesForTextureMap, this);
        };
        Texturer.prototype._loadFilesForTextureMap = function (textureMapConfig) {
            textureMapConfig.getFiles().forEach(function (file) {
                //console.log(path.join(this._configParser.getFolderRootFrom(), file));
                Texturer_1.helper.readImageFile(path.join(this._configParser.getFolderRootFrom(), file), function (error, instance) {
                    if (error) {
                        this._shutdown(error);
                    }
                    else {
                        var loadedDataDictionary = new Texturer_1.Dictionary(), trim = { left: 0, right: 0, top: 0, bottom: 0 }, realWidth = instance.width, realHeight = instance.height;
                        // trim image if it is part of sprite
                        if (!textureMapConfig.getJustCopy() && !textureMapConfig.getCompressionOptions()["disable-trim"]) {
                            var trimResult = Texturer_1.helper.trimImage(instance);
                            // new trimmed png instance and trim parameters
                            instance = trimResult.png;
                            trim = trimResult.trim;
                        }
                        loadedDataDictionary.setValue("opaque", Texturer_1.helper.isOpaque(instance));
                        loadedDataDictionary.setValue("realWidth", realWidth);
                        loadedDataDictionary.setValue("realHeight", realHeight);
                        loadedDataDictionary.setValue("width", instance.width);
                        loadedDataDictionary.setValue("height", instance.height);
                        loadedDataDictionary.setValue("bitmap", instance.data);
                        loadedDataDictionary.setValue("trim", trim);
                        this._loadedFilesDictionary.setValue(file, loadedDataDictionary);
                        this._loadedFilesCount++;
                        if (this._totalFilesCount === this._loadedFilesCount) {
                            logMemory("files loaded: " + this._totalFilesCount);
                            this._generateTextureMaps();
                        }
                    }
                }, this);
            }, this);
        };
        Texturer.prototype._generateTextureMaps = function () {
            this._configParser.getTextureMapConfigArray().forEach(this._generateTextureMap, this);
        };
        Texturer.prototype._generateTextureMap = function (textureMapConfig) {
            if (textureMapConfig.getJustCopy()) {
                textureMapConfig.getFiles().forEach(function (file) {
                    var fromFile = path.join(this._configParser.getFolderRootFrom(), file), toFile = path.join(this._configParser.getFolderRootToImagesServer(), file), loadedFileDictionary = this._loadedFilesDictionary.getValue(file), _this = this, copiedFilesCount = 0;
                    try {
                        Texturer_1.helper.createDirectory(path.dirname(toFile));
                        // check if file exists
                        if (fs.existsSync(toFile)) {
                            // remove read-only and other attributes
                            fs.chmodSync(toFile, '0777');
                            // delete file
                            fs.unlinkSync(toFile);
                        }
                    }
                    catch (e) {
                        this._shutdown(new Error("COPY PREPARATION: " + e.toString()));
                    }
                    // fs.link(fromFile, toFile, function (error) {
                    this._cq.runTask("copyFile", { source: fromFile, target: toFile }, function (error) {
                        if (error) {
                            _this._shutdown(new Error("" +
                                "COPY: \n" +
                                "src: " + fromFile + "\n" +
                                "dst: " + toFile + "\n" +
                                "error: " + error));
                        }
                        var textureMapDictionary = new Texturer_1.Dictionary(), width = loadedFileDictionary.getValue("width"), height = loadedFileDictionary.getValue("height"), base64 = "data:image/png;base64," + fs.readFileSync(fromFile).toString('base64');
                        textureMapDictionary.setValue("width", width);
                        textureMapDictionary.setValue("height", height);
                        textureMapDictionary.setValue("area", width * height);
                        textureMapDictionary.setValue("repeat-x", false);
                        textureMapDictionary.setValue("repeat-y", false);
                        textureMapDictionary.setValue("base64", textureMapConfig.encodeDataURI() && base64.length < 32 * 1024 - 256 ? base64 : null);
                        //textureMapDictionary.setValue("base64", null);
                        textureMapDictionary.setValue("file", file);
                        textureMapDictionary.addValue("textures", {
                            id: file,
                            x: 0,
                            y: 0,
                            width: width,
                            height: height,
                            realWidth: loadedFileDictionary.getValue("realWidth"),
                            realHeight: loadedFileDictionary.getValue("realHeight"),
                            bitmap: loadedFileDictionary.getValue("bitmap"),
                            trim: loadedFileDictionary.getValue("trim"),
                            opaque: loadedFileDictionary.getValue("opaque")
                        });
                        _this._textureMapArray.push(textureMapDictionary);
                        copiedFilesCount++;
                        if (textureMapConfig.getFiles().length === copiedFilesCount) {
                            _this._onTextureMapGenerated();
                        }
                    }, this);
                }, this);
            }
            else {
                // create size array (id/width/height)
                var sizeArray = [];
                textureMapConfig.getFiles().forEach(function (file) {
                    var loadedFileDictionary = this._loadedFilesDictionary.getValue(file);
                    sizeArray.push({
                        id: file,
                        width: loadedFileDictionary.getValue("width"),
                        height: loadedFileDictionary.getValue("height")
                    });
                }, this);
                var textureMapGenerator = new Texturer_1.TextureMapGenerator(this._cq);
                textureMapGenerator.generateTextureMap(sizeArray, textureMapConfig, function (error, textureMapDictionary) {
                    if (error) {
                        this._shutdown(new Error("Texture Generator: Can't pack texture map '" + textureMapConfig.getPNGFileName() + "'. " + error));
                    }
                    else if (!textureMapDictionary) {
                        this._shutdown(new Error("Texture Generator: Can't pack texture map '" + textureMapConfig.getPNGFileName() + "' - too large art. Split images into 2 or more folders!"));
                    }
                    else {
                        this._compressTextureMapImage(textureMapConfig, textureMapDictionary);
                    }
                }, this);
            }
        };
        /**
         * @param textureMapConfig
         * @param {Dictionary} textureMapDictionary
         */
        Texturer.prototype._compressTextureMapImage = function (textureMapConfig, textureMapDictionary) {
            console.log(textureMapConfig.getPNGFileName() + ": w = " + textureMapDictionary.getValue("width") + ", h = " + textureMapDictionary.getValue("height") + ", area = " + textureMapDictionary.getValue("area"));
            var textureArray = [];
            textureMapDictionary.getValue("textures").forEach(function (texture) {
                var loadedFileDictionary = this._loadedFilesDictionary.getValue(texture.id);
                textureArray.push({
                    x: texture.x,
                    y: texture.y,
                    width: texture.width,
                    height: texture.height,
                    realWidth: loadedFileDictionary.getValue("realWidth"),
                    realHeight: loadedFileDictionary.getValue("realHeight"),
                    bitmapSerialized: loadedFileDictionary.getValue("bitmap") //texture.data.png.data
                });
            }, this);
            var bestCompressedImage = null, filterCount = 0, filterTypes = [0, 1, 2, 3, 4];
            for (var i = 0; i < filterTypes.length; i++) {
                var data = {
                    options: textureMapConfig.getCompressionOptions(),
                    filterType: filterTypes[i],
                    width: textureMapDictionary.getValue("width"),
                    height: textureMapDictionary.getValue("height"),
                    textureArray: textureArray
                };
                this._cq.runTask("compressPNG", data, function (error, result) {
                    if (error) {
                        this._shutdown(new Error(error));
                    }
                    else {
                        // check if better compressed
                        var compressedImage = new Buffer(result.compressedPNG);
                        if (bestCompressedImage === null || compressedImage.length < bestCompressedImage.length) {
                            bestCompressedImage = compressedImage;
                        }
                        // check if finished
                        filterCount++;
                        if (filterCount === filterTypes.length) {
                            this._onTextureMapImageCompressed(textureMapConfig, textureMapDictionary, bestCompressedImage);
                        }
                    }
                }, this);
            }
        };
        /**
         * @param textureMapConfig
         * @param {Dictionary} textureMapDictionary
         * @param compressedImage
         */
        Texturer.prototype._onTextureMapImageCompressed = function (textureMapConfig, textureMapDictionary, compressedImage) {
            var base64 = "data:image/png;base64," + compressedImage.toString('base64');
            textureMapDictionary.setValue("base64", textureMapConfig.encodeDataURI() && base64.length < 32 * 1024 - 256 ? base64 : null);
            textureMapDictionary.setValue("file", textureMapConfig.getPNGFileName());
            // write png
            var file = path.join(this._configParser.getFolderRootToImagesServer(), textureMapConfig.getPNGFileName()), data = {
                file: file,
                content: Array.prototype.slice.call(compressedImage, 0),
                tinypng: {
                    enabled: !!textureMapConfig.getCompressionOptions()["tinypng"] && !textureMapConfig.getJustCopy(),
                    configFile: "./config.json"
                }
            };
            this._cq.runTask("writeFile", data, function (error, result) {
                if (error) {
                    this._shutdown(error);
                }
                else {
                    this._textureMapArray.push(textureMapDictionary);
                    this._onTextureMapGenerated();
                }
            }, this);
        };
        Texturer.prototype._onTextureMapGenerated = function () {
            if (this._textureMapArray.length === this._totalTexturMapsRequiredCount) {
                logMemory('build time: ' + (Date.now() - _startTime) + ' ms');
                var duplicateFileNamesArray = Texturer_1.helper.writeTexturePoolFile(this._configParser, this._loadedFilesDictionary, this._textureMapArray);
                this._shutdown(duplicateFileNamesArray.length > 0 ? new Error("Found duplicate file names:\n" + duplicateFileNamesArray.join("\n")) : null);
            }
        };
        Texturer.prototype._shutdown = function (error) {
            if (error) {
                this._cq.abort();
                this._callback.call(this._thisArg, error);
            }
            else {
                this._cq.shutdown(function () {
                    this._callback.call(this._thisArg, null);
                }, this);
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
module.exports = Texturer;
