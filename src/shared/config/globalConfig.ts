///<reference path="baseOption.ts"/>

///<reference path="options/bruteForceTime.ts"/>
///<reference path="options/excludeRegExPattern.ts"/>
///<reference path="options/folders.ts"/>
///<reference path="options/taskFolder.ts"/>
///<reference path="options/paddingX.ts"/>
///<reference path="options/paddingY.ts"/>
///<reference path="options/templates.ts"/>
///<reference path="options/gridStep.ts"/>
///<reference path="options/repeatX.ts"/>
///<reference path="options/repeatY.ts"/>
///<reference path="options/textureMapFileName.ts"/>

///<reference path="process/dataURI.ts"/>
///<reference path="process/compress.ts"/>
///<reference path="process/trim.ts"/>
///<reference path="process/dimensions.ts"/>

///<reference path="tasks/taskDefaults.ts"/>
///<reference path="tasks/copyTask.ts"/>
///<reference path="tasks/copyTasks.ts"/>
///<reference path="tasks/textureMapTask.ts"/>
///<reference path="tasks/textureMapTasks.ts"/>
namespace Texturer.Config {

	let path = require('path');

	export class GlobalConfig {
		folders : Folders;
		templates : string[];
		excludeRegExPattern : string;
		copyTasks : CopyTask[];
		textureMapTasks : TextureMapTask[];
		/*
		 bruteForceTime : number;
		 gridStep : number;
		 paddingX : number;
		 paddingY : number;
		 trim : ProcessTrim;
		 dataURI : ProcessDataURI;
		 compress : ProcessCompress;
		 */
		taskDefaults : TaskDefaults;

		constructor(config : Object) {
			this.folders = new Folders(config);
			Utils.FSHelper.createDirectory(this.getFolderRootToIndexHtml());

			this.templates           = new Templates(config).getValue();
			this.excludeRegExPattern = new ExcludeRegExPattern(config).getValue();

			this.taskDefaults = new TaskDefaults(config);
			this.textureMapTasks = new TextureMapTasks(config, this).getValue();
			this.copyTasks       = new CopyTasks(config, this).getValue();
		}

		getFolderRootFrom() : string {
			return path.join(this.folders.rootFolder, this.folders.fromFolder);
		}

		getFolderRootTo() : string {
			return path.join(this.folders.rootFolder, this.folders.toFolder);
		}

		getFolderRootToIndexHtml() : string {
			return path.join(this.folders.rootFolder, this.folders.toFolder, this.folders.indexHtmlFolder);
		}
	}

}
