/*
 * Project: textureMapGenerator
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
function ConfigParser (configFileName) {
	var configString;

	try {
		configString = fs.readFileSync(configFileName, "utf8");
	} catch (e) {
		throw new Error("CFG: Can't read config file \"" + configFileName + "\n");
	}

/*
	try {
		jsonLint.parse(configString);
	} catch (e) {
		throw new Error("CFG: error in file " + configFileName + ": JSON invalid: \"" + e + "\n");
	}
*/

		try {
			this._config = eval('(' + configString + ')');
		} catch (e) {
			throw new Error("CFG: error in file " + configFileName + ": JSON invalid: \"" + e + "\n");
		}
	//this._config = JSON.parse(configString);
	this._textureMapConfigArray = [];
	this._folders = {
		root : process.cwd(),
		from : this._config["folders"]["resources(in)"],
		to   : this._config["folders"]["images(out)"]
	};
	this._validate();
}

ConfigParser.prototype = {
	_validate : function () {
		helper.createDirectory(this.getFolderRootTo());
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
