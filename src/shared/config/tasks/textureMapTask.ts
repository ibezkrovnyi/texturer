///<reference path="../process/trim.ts"/>
///<reference path="../process/dataURI.ts"/>
///<reference path="../process/compress.ts"/>
///<reference path="../process/dimensions.ts"/>
///<reference path="../options/taskFolder.ts"/>
///<reference path="../globalConfig.ts"/>
namespace Texturer.Config {

	let path = require("path");

	export class TextureMapTask {
		folder : string;
		bruteForceTime : number;
		paddingX : number;
		paddingY : number;
		gridStep : number;
		files : string[];
		textureMapFileName : string;
		repeatX : boolean;
		repeatY : boolean;
		trim : ProcessTrim;
		dataURI : ProcessDataURI;
		compress : ProcessCompress;
		dimensions : ProcessDimensions;

		constructor(taskObject : Object, globalConfig : GlobalConfig) {
			this.folder             = new TaskFolder(taskObject).getValue();
			this.textureMapFileName = new TextureMapFileName(taskObject).getValue();

			this.repeatX = new RepeatX(taskObject).getValue();
			this.repeatY = new RepeatY(taskObject).getValue();

			this.gridStep       = new GridStep(taskObject, globalConfig.taskDefaults.gridStep).getValue();
			this.paddingX       = new PaddingX(taskObject, globalConfig.taskDefaults.paddingX).getValue();
			this.paddingY       = new PaddingY(taskObject, globalConfig.taskDefaults.paddingY).getValue();
			this.bruteForceTime = new BruteForceTime(taskObject, globalConfig.taskDefaults.bruteForceTime).getValue();

			this.dimensions = new ProcessDimensions(taskObject, globalConfig.taskDefaults.dimensions);
			this.trim       = new ProcessTrim(taskObject, globalConfig.taskDefaults.trim);
			this.dataURI    = new ProcessDataURI(taskObject, globalConfig.taskDefaults.dataURI);
			this.compress   = new ProcessCompress(taskObject, globalConfig.taskDefaults.compress);

			this.files = this._getFiles(globalConfig);
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
