///<reference path="../../node.d.ts"/>
///<reference path="../process/dataURI.ts"/>
///<reference path="../globalConfig.ts"/>
///<reference path="../../utils/fsHelper.ts"/>
namespace Texturer.Config {

	let path = require("path");

	export class CopyTask {
		folder : string;
		files : string[];
		dataURI : ProcessDataURI;

		constructor(taskObject : Object, globalConfig : GlobalConfig) {
			this.folder  = new TaskFolder(taskObject).getValue();
			this.dataURI = new ProcessDataURI(taskObject, globalConfig.taskDefaults.dataURI);
			this.files   = this._getFiles(globalConfig);
		}

		private _getFiles(globalConfig) {
			var folder     = this.folder,
				fullFolder = path.join(globalConfig.folders.rootFolder, globalConfig.folders.fromFolder, folder);

			Utils.FSHelper.checkDirectoryExistsSync(fullFolder);

			var regex  = globalConfig.excludeRegExPattern ? new RegExp(globalConfig.excludeRegExPattern, "gi") : null,
				filter = regex ? function (name) {
					regex.lastIndex = 0;
					return regex.test(name);
				} : null;

			var files = Utils.FSHelper.getFilesInFolder(fullFolder, filter, true).map(file => {
				return path.join(this.folder, file).replace(/\\/g, "/");
			});

			if (files.length <= 0) {
				throw "no files in fullfolder " + folder;
			}
			return files;
		};
	}
}
