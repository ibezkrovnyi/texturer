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
    /*
     * Project: Texturer
     *
     * User: Igor Bezkrovny
     * Date: 18.10.2014
     * Time: 19:36
     * MIT LICENSE
     */
    var _PackerNode = (function () {
        function _PackerNode(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.leftChild = null;
            this.rightChild = null;
            this.used = false;
        }
        return _PackerNode;
    })();
    var BinPacker = (function () {
        /**
         * @param {number} width - The containing rectangle width
         * @param {number} height - The containing rectangle height
         * @param {number} multipleOf - use to make all coordinates/size to be multiply of
         */
        function BinPacker(width, height, multipleOf) {
            //this.multipleOf = typeof multipleOf !== 'number' ? 0 : multipleOf;
            width = this._fixCoordinate(width);
            height = this._fixCoordinate(height);
            this._node = new _PackerNode(0, 0, width, height);
            this._multipleOf = typeof multipleOf !== 'number' ? 0 : multipleOf;
            // initialize
            this._usedWidth = 0;
            this._usedHeight = 0;
        }
        BinPacker.prototype.getRealDimensions = function () {
            return { width: this._usedWidth, height: this._usedHeight };
        };
        BinPacker.prototype.placeNextRectangle = function (width, height) {
            width = this._fixCoordinate(width);
            height = this._fixCoordinate(height);
            function recursiveFindPlace(node, width, height) {
                node.visited = true;
                if (node.leftChild) {
                    var place = recursiveFindPlace(node.leftChild, width, height);
                    return place ? place : recursiveFindPlace(node.rightChild, width, height);
                }
                else {
                    if (node.used || width > node.width || height > node.height)
                        return null;
                    // if it fits perfectly then use this gap
                    if (width === node.width && height === node.height) {
                        node.used = true;
                        return { x: node.x, y: node.y };
                    }
                    // initialize children
                    node.leftChild = new _PackerNode(node.x, node.y, node.width, node.height);
                    node.rightChild = new _PackerNode(node.x, node.y, node.width, node.height);
                    // checks if we partition in vertical or horizontal
                    if (node.width - width > node.height - height) {
                        node.leftChild.width = width;
                        node.rightChild.x = node.x + width;
                        node.rightChild.width = node.width - width;
                    }
                    else {
                        node.leftChild.height = height;
                        node.rightChild.y = node.y + height;
                        node.rightChild.height = node.height - height;
                    }
                    return recursiveFindPlace(node.leftChild, width, height);
                }
            }
            // perform the search
            var place = recursiveFindPlace(this._node, width, height);
            // if fitted then recalculate the used dimensions
            if (place) {
                if (this._usedWidth < place.x + width)
                    this._usedWidth = place.x + width;
                if (this._usedHeight < place.y + height)
                    this._usedHeight = place.y + height;
            }
            return place;
        };
        BinPacker.prototype._fixCoordinate = function (coordinate) {
            if (this._multipleOf > 0) {
                if (coordinate % this._multipleOf > 0) {
                    coordinate += this._multipleOf - (coordinate % this._multipleOf);
                }
            }
            return coordinate;
        };
        return BinPacker;
    })();
    Texturer.BinPacker = BinPacker;
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
var TinyPng;
(function (TinyPng) {
    var fs = require("fs"), https = require("https"), url = require("url");
    function getBestKey(configFile) {
        var data = eval("(" + fs.readFileSync(configFile, 'utf8') + ")");
        var curDate = new Date(), curYear = curDate.getFullYear(), curMonth = curDate.getMonth() + 1, best = null;
        data["tinypng-api-keys"].forEach(function (keyData) {
            // check if month passed
            if (curYear !== keyData.year || curMonth !== keyData.month) {
                keyData.used = 0;
                keyData.month = curMonth;
                keyData.year = curYear;
            }
            // check for best (less used) key
            if (best === null || keyData.used < best.used) {
                best = keyData;
            }
        });
        best.used++;
        fs.writeFileSync(configFile, JSON.stringify(data, null, "\t"));
        return best.key;
    }
    function requestFile(configFile, postData, callback, thisArg) {
        var req_options = url.parse("https://api.tinypng.com/shrink");
        req_options.auth = "api:" + getBestKey(configFile);
        req_options.method = "POST";
        var req = https.request(req_options, function (res) {
            if (res.statusCode === 201) {
                getFile(res.headers.location, callback, thisArg);
            }
            else {
                if (callback) {
                    callback.call(thisArg, 'tinypng.com: status=' + res.statusCode + ', error=' + res.statusMessage, null);
                    callback = null;
                    thisArg = null;
                }
            }
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            //res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('BODY: ' + chunk);
            });
        });
        req.on('error', function (e) {
            if (callback) {
                callback.call(thisArg, 'tinypng.com: error with request: ' + e.message, null);
                callback = null;
                thisArg = null;
            }
        });
        // write data to request body
        req.write(postData);
        req.end();
    }
    TinyPng.requestFile = requestFile;
    function getFile(url, callback, thisArg) {
        https.get(url, function (res) {
            var chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function () {
                if (callback) {
                    callback.call(thisArg, null, Buffer.concat(chunks));
                    callback = null;
                    thisArg = null;
                }
            });
            res.on("error", function (e) {
                if (callback) {
                    callback.call(thisArg, 'tinypng.com: error receiving compressed file: ' + e.message, null);
                    callback = null;
                    thisArg = null;
                }
            });
        });
    }
})(TinyPng || (TinyPng = {}));
var ClusterQueue;
(function (ClusterQueue) {
    var taskHandlers = {};
    process.on("message", function (data) {
        var taskName = data["taskName"], taskData = data["taskData"];
        if (typeof taskHandlers[taskName] !== 'undefined') {
            try {
                taskHandlers[taskName].taskHandler.call(taskHandlers[taskName].thisArg, taskData);
            }
            catch (e) {
                sendResult("worker: error in task " + taskName + ": " + e);
            }
        }
        else {
            sendResult("worker: taskHandler for task " + taskName + " is not defined.");
        }
    });
    function sendResult(error, taskResult) {
        process.send({ error: error, taskResult: taskResult });
    }
    /**
     * @param {string} taskName
     * @param {function(this:T, taskData : *):void} taskHandler
     * @param {T} thisArg
     * @template T
     */
    function registerTask(taskName, taskHandler, thisArg) {
        taskHandlers[taskName] = {
            taskHandler: taskHandler,
            thisArg: thisArg
        };
    }
    ClusterQueue.registerTask = registerTask;
    /**
     * @param {string} error
     * @param {*} taskResult
     */
    function send(error, taskResult) {
        sendResult(error, taskResult);
    }
    ClusterQueue.send = send;
})(ClusterQueue || (ClusterQueue = {}));
/// <reference path='./helper.ts' />
/// <reference path='./binPackerAlgorithm.ts' />
/// <reference path='./dictionary.ts' />
/// <reference path='./tinypng.ts' />
/// <reference path='./clusterWorker.ts' />
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
    var pngEngine = require("./modules/node-png/lib/png").PNG, path = require("path"), fs = require("fs");
    ClusterQueue.registerTask("binPacker", function (taskData) {
        var best = null;
        for (var x = taskData.fromX; x <= taskData.toX; x += 16) {
            for (var y = taskData.fromY; y <= taskData.toY; y += 16) {
                if (taskData.totalPixels <= x * y) {
                    var map = tryToPack(taskData.files, x, y, taskData.gridStep);
                    if (map && (best === null || best.getValue("area") > map.getValue("area"))) {
                        best = map;
                    }
                }
            }
        }
        // send processed taskData back to cluster
        if (best) {
            ClusterQueue.send(null, best.getSerialized());
        }
        else {
            ClusterQueue.send(null, null);
        }
    }, null);
    ClusterQueue.registerTask("writeFile", function (taskData) {
        try {
            Texturer.helper.createDirectory(path.dirname(taskData.file));
            // check if file exists
            if (fs.existsSync(taskData.file)) {
                // remove read-only and other attributes
                fs.chmodSync(taskData.file, '0777');
                // delete file
                fs.unlinkSync(taskData.file);
            }
            var data = new Buffer(taskData.content);
            if (taskData.tinypng.enabled) {
                console.log("tinypng.com task...");
                TinyPng.requestFile(taskData.tinypng.configFile, data, function (error, data) {
                    if (!error) {
                        fs.writeFileSync(taskData.file, data);
                    }
                    ClusterQueue.send(error, null);
                }, null);
            }
            else {
                fs.writeFileSync(taskData.file, data);
                ClusterQueue.send(null, null);
            }
        }
        catch (e) {
            ClusterQueue.send("worker 'writeFile': file=" + taskData.file + ", " + e.toString() + "\nstack: " + (e.stack), null);
        }
    }, null);
    ClusterQueue.registerTask("compressPNG", function (taskData) {
        var options = Texturer.helper.extend(taskData.options, {
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
            texturePng.data = new Buffer(texture.bitmapSerialized); //bitmap.getRGBABuffer();
            texturePng.bitblt(png, 0, 0, texture.width, texture.height, texture.x, texture.y);
        });
        var stream = png.pack(), chunks = [];
        stream.on("data", function (chunk) {
            chunks.push(chunk);
        });
        stream.on("end", function () {
            ClusterQueue.send(null, { compressedPNG: Array.prototype.slice.call(Buffer.concat(chunks), 0), filterType: options.filterType });
        });
    }, null);
    ClusterQueue.registerTask("copyFile", function (taskData) {
        var source = taskData.source, target = taskData.target, finished = false;
        function done(err) {
            if (!finished) {
                ClusterQueue.send(!!err ? err : null, null);
                finished = true;
            }
        }
        var rd = fs.createReadStream(source);
        rd.on("error", done);
        var wr = fs.createWriteStream(target);
        wr.on("error", done);
        wr.on("close", function (ex) {
            // restore original file's modified date/time
            var stat = fs.statSync(source);
            fs.utimesSync(target, stat.atime, stat.mtime);
            // done
            done();
        });
        rd.pipe(wr);
    }, null);
    /**
     * @param {{id : string, width : number, height : number}[]} imageInfoArray
     * @param {number} spriteWidth
     * @param {number} spriteHeight
     * @returns {Dictionary}
     */
    function tryToPack(imageInfoArray, spriteWidth, spriteHeight, gridStep) {
        var packer = new Texturer.BinPacker(spriteWidth, spriteHeight, gridStep), textureMap = new Texturer.Dictionary(), textures = [], width = 0, height = 0;
        for (var i = 0; i < imageInfoArray.length; i++) {
            var imageInfo = imageInfoArray[i], w = imageInfo.width, h = imageInfo.height, placeCoordinates = packer.placeNextRectangle(w, h);
            if (placeCoordinates !== null) {
                textureMap.addValue("textures", {
                    id: imageInfo.id,
                    x: placeCoordinates.x,
                    y: placeCoordinates.y,
                    width: imageInfo.width,
                    height: imageInfo.height
                });
                width = Math.max(width, placeCoordinates.x + imageInfo.width);
                height = Math.max(height, placeCoordinates.y + imageInfo.height);
            }
            else {
                textureMap = null;
                break;
            }
        }
        if (textureMap) {
            textureMap.setValue("width", width);
            textureMap.setValue("height", height);
            textureMap.setValue("area", width * height);
        }
        return textureMap;
    }
})(Texturer || (Texturer = {}));
