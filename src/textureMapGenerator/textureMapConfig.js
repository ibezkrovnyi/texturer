/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */

var fs     = require("fs"),
	path   = require("path"),
	helper = require("../helper.js");

/**
 * @class TextureMapConfig
 * @constructor
 */
function TextureMapConfig (configParser, resourceTextureMapConfig) {
	var folder = resourceTextureMapConfig["folder(in)"],
		fromFolder = configParser.getFolderFrom(),
		rootFolder = configParser.getFolderRoot(),
		fullFolder = path.join(rootFolder, fromFolder, folder);

	helper.checkDirectoryExistsSync(fullFolder);
	var files = fs.readdirSync(fullFolder);
	if (files === null || typeof files !== "object") {
		throw "files = null";
	}

	files.forEach(function (file, index, theArray) {
		theArray[index] = path.join(folder, file).replace(/\\/g, "/");
	});

	// filter only files
	files = files.filter(function (file) {
		//return helper.isImageFileSupported(path.join(rootFolder, fromFolder, file));
		return fs.statSync(path.join(rootFolder, fromFolder, file)).isFile();
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
	} else {
		this._pngFileName = resourceTextureMapConfig["texture-map(out)"];
		this._repeatX = typeof resourceTextureMapConfig["repeat-x"] === 'boolean' ? resourceTextureMapConfig["repeat-x"] : false;
		this._repeatY = typeof resourceTextureMapConfig["repeat-y"] === 'boolean' ? resourceTextureMapConfig["repeat-y"] : false;
		this._nPass = typeof resourceTextureMapConfig["n-pass"] === 'number' ? resourceTextureMapConfig["n-pass"] : 0;
	}
}

TextureMapConfig.prototype = {
	getFiles : function () {
		return this._files;
	},

	getFolder : function () {
		return this._folder;
	},

	getPNGFileName : function () {
		return this._pngFileName;
	},

	getRepeatX : function () {
		return this._repeatX;
	},

	getRepeatY : function () {
		return this._repeatY;
	},

	getNPass : function () {
		return this._nPass;
	},

	getJustCopy : function () {
		return this._copy;
	},

	encodeDataURI : function () {
		return this._base64;
	},

	getCompressionOptions : function () {
		return helper.extend(this._configParser.getCompressionOptions(), this._pngOptions);
	},

	getGridStep : function () {
		return this._gridStep;
	}
};

module.exports = TextureMapConfig;
