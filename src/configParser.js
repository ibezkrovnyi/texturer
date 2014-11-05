/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */

var fs               = require("fs"),
	path             = require("path"),
	helper           = require("./helper.js"),
	TextureMapConfig = require("./textureMapGenerator/textureMapConfig.js");

/**
 * @class ConfigParser
 * @constructor
 */
function ConfigParser (configJSONString) {
/*
	try {
		jsonLint.parse(configString);
	} catch (e) {
		throw new Error("CFG: error in file " + configFileName + ": JSON invalid: \"" + e + "\n");
	}
*/

		try {
			this._config = eval('(' + configJSONString + ')');
		} catch (e) {
			throw new Error("CFG: error in file " + configFileName + ": JSON invalid: \"" + e + "\n");
		}
	//this._config = JSON.parse(configString);
	this._textureMapConfigArray = [];
	this._folders = {
		root : process.cwd(),
		from : this._config["folders"]["source(in)"],
		to   : this._config["folders"]["target(out)"]
	};
	this._validate();
}

ConfigParser.prototype = {
	_validate : function () {
		helper.createDirectory(this.getFolderRootToImagesServer());
		this._config["tasks"].forEach(function (resourceTextureMapConfig) {
			this._textureMapConfigArray.push(new TextureMapConfig(
				this,
				resourceTextureMapConfig
			));
		}, this);
	},

	getFolderRootFrom : function () {
		return path.join(this.getFolderRoot(), this.getFolderFrom());
	},

	getFolderRootTo : function () {
		return path.join(this.getFolderRoot(), this.getFolderTo());
	},

	getFolderRootToImagesServer : function () {
		return path.join(this.getFolderRoot(), this.getFolderTo(), this.getFolderImagesServer());
	},

	getFolderRoot : function () {
		return this._folders.root;
	},

	getFolderFrom : function () {
		return this._folders.from;
	},

	getFolderTo : function () {
		return this._folders.to;
	},

	getTextureMapConfigArray : function () {
		return this._textureMapConfigArray;
	},

	getFolderImagesServer : function () {
		return this._config["folders"]["images(index.html)"];
	},

	getNameSpace : function () {
		return this._config["nameSpace"];
	},

	encodeDataURI : function () {
		return typeof this._config["base64"] === 'boolean' ? this._config["base64"] : false;
	},

	getCompressionOptions : function () {
		return typeof this._config["compression"] !== 'undefined' ? this._config["compression"] : {};
	}
};
module.exports = ConfigParser;
