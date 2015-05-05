/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */
var path = require("path");
var helper = require("./helper");
var TextureMapConfig = (function () {
    function TextureMapConfig(configParser, resourceTextureMapConfig) {
        var folder = resourceTextureMapConfig["folder(in)"], fromFolder = configParser.getFolderFrom(), rootFolder = configParser.getFolderRoot(), fullFolder = path.join(rootFolder, fromFolder, folder);
        helper.checkDirectoryExistsSync(fullFolder);
        var regex = configParser.getFileAndFolderNameIgnoreRegEx() ? new RegExp(configParser.getFileAndFolderNameIgnoreRegEx(), "gi") : null, filter = regex ? function (name) {
            regex.lastIndex = 0;
            return regex.test(name);
        } : null;
        var files = helper.getFilesInFolder(fullFolder, filter, true).map(function (file) {
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
        return helper.extend(this._configParser.getCompressionOptions(), this._pngOptions);
    };
    TextureMapConfig.prototype.getGridStep = function () {
        return this._gridStep;
    };
    return TextureMapConfig;
})();
exports.TextureMapConfig = TextureMapConfig;
//# sourceMappingURL=textureMapConfig.js.map