/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */

/// <reference path='./helper' />
module Texturer {
	var fs     = require("fs"),
		path   = require("path");

	export class TextureMapConfig {
		private _configParser;
		private _files;
		private _folder;
		private _copy;
		private _base64;
		private _pngOptions;
		private _gridStep;
		private _pngFileName;
		private _repeatX;
		private _repeatY;
		private _nPass;

		constructor(configParser, resourceTextureMapConfig) {
			var folder = resourceTextureMapConfig["folder(in)"],
				fromFolder = configParser.getFolderFrom(),
				rootFolder = configParser.getFolderRoot(),
				fullFolder = path.join(rootFolder, fromFolder, folder);

			helper.checkDirectoryExistsSync(fullFolder);

			var regex = configParser.getFileAndFolderNameIgnoreRegEx() ? new RegExp(configParser.getFileAndFolderNameIgnoreRegEx(), "gi") : null,
				filter = regex ? function (name) {
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
			} else {
				this._pngFileName = resourceTextureMapConfig["texture-map(out)"];
				this._repeatX = typeof resourceTextureMapConfig["repeat-x"] === 'boolean' ? resourceTextureMapConfig["repeat-x"] : false;
				this._repeatY = typeof resourceTextureMapConfig["repeat-y"] === 'boolean' ? resourceTextureMapConfig["repeat-y"] : false;
				this._nPass = typeof resourceTextureMapConfig["n-pass"] === 'number' ? resourceTextureMapConfig["n-pass"] : this._configParser.getNPass();
			}
		}

		public getFiles() {
			return this._files;
		}

		public getFolder() {
			return this._folder;
		}

		public getPNGFileName() {
			return this._pngFileName;
		}

		public getRepeatX() {
			return this._repeatX;
		}

		public getRepeatY() {
			return this._repeatY;
		}

		public getNPass() {
			return this._nPass;
		}

		public getJustCopy() {
			return this._copy;
		}

		public encodeDataURI() {
			return this._base64;
		}

		public getCompressionOptions() {
			return helper.extend(this._configParser.getCompressionOptions(), this._pngOptions);
		}

		public getGridStep() {
			return this._gridStep;
		}
	}

}
