/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */

/// <reference path='./typings/node.d.ts' />
/// <reference path='./helper' />
/// <reference path='./textureMapGenerator.ts' />
/// <reference path='./textureMapConfig' />
module Texturer {
	var fs                = require("fs"),
		path              = require("path");

	// TODO: fill global config with options
	export interface GlobalConfig {

	}
	export class ConfigParser {
		private _config : GlobalConfig;
		private _folders : { root : string; from : string; to : string };
		private _textureMapConfigArray : TextureMapConfig[];
		private _templates : string[];

		constructor(configJSON : string) {
			try {
				// eval is used to allow comments inside json
				this._config = <GlobalConfig>eval('(' + configJSON + ')');
			} catch (e) {
				throw new Error("Config JSON invalid: \"" + e + "\n");
			}

			this._textureMapConfigArray = [];
			this._folders = null;
			this._parse();
		}

		private _parse() {
			this._folders = {
				root : process.cwd(),
				from : this._config["folders"]["source(in)"],
				to   : this._config["folders"]["target(out)"]
			};

			if(Object.prototype.toString.call(this._config["templates"]) === "[object Array]") {
				this._templates = this._config["templates"];
			} else {
				throw new Error("\"templates\" is not defined in configuration");
			}

			helper.createDirectory(this.getFolderRootToImagesServer());
			this._config["tasks"].forEach(function (resourceTextureMapConfig) {
				this._textureMapConfigArray.push(new TextureMapConfig(
					this,
					resourceTextureMapConfig
				));
			}, this);
		}

		public getFolderRootFrom() : string {
			return path.join(this.getFolderRoot(), this.getFolderFrom());
		}

		public getFolderRootTo() {
			return path.join(this.getFolderRoot(), this.getFolderTo());
		}

		public getFolderRootToImagesServer() {
			return path.join(this.getFolderRoot(), this.getFolderTo(), this.getFolderImagesServer());
		}

		public getFolderRoot() {
			return this._folders.root;
		}

		public getFolderFrom() {
			return this._folders.from;
		}

		public getFolderTo() {
			return this._folders.to;
		}

		public getTextureMapConfigArray() {
			return this._textureMapConfigArray;
		}

		public getFolderImagesServer() {
			return this._config["folders"]["images(index.html)"];
		}

		public getNameSpace() {
			return this._config["nameSpace"];
		}

		public encodeDataURI() {
			return typeof this._config["base64"] === 'boolean' ? this._config["base64"] : false;
		}

		public getCompressionOptions() {
			return typeof this._config["compression"] !== 'undefined' ? this._config["compression"] : {};
		}

		public getFileAndFolderNameIgnoreRegEx() {
			return (typeof this._config["exclude"] === 'string' && this._config["exclude"].length > 0) ? this._config["exclude"] : null;
		}

		public getTemplates() : string[] {
			return this._templates;
		}

	}
}

