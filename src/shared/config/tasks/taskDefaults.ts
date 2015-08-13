///<reference path="../baseOption.ts"/>
///<reference path="../process/trim.ts"/>
///<reference path="../process/dataURI.ts"/>
///<reference path="../process/compress.ts"/>
///<reference path="../process/dimensions.ts"/>
///<reference path="../options/bruteForceTime.ts"/>
///<reference path="../options/gridStep.ts"/>
///<reference path="../options/paddingX.ts"/>
///<reference path="../options/paddingY.ts"/>
namespace Texturer.Config {

	class TaskDefaultsContainer extends BaseOption<Object> {
		getValue() : Object {
			return this._getPropertyValue('task-defaults');
		}
	}

	export class TaskDefaults {
		bruteForceTime : number;
		gridStep : number;
		paddingX : number;
		paddingY : number;
		trim : ProcessTrim;
		dataURI : ProcessDataURI;
		compress : ProcessCompress;
		dimensions : ProcessDimensions;

		constructor(config : Object) {

			let taskDefaultsContainer = new TaskDefaultsContainer(config, null);

			this.bruteForceTime = new BruteForceTime(taskDefaultsContainer).getValue();
			this.gridStep       = new GridStep(taskDefaultsContainer).getValue();
			this.paddingX       = new PaddingX(taskDefaultsContainer).getValue();
			this.paddingY       = new PaddingY(taskDefaultsContainer).getValue();

			this.trim       = new ProcessTrim(taskDefaultsContainer);
			this.dataURI    = new ProcessDataURI(taskDefaultsContainer);
			this.compress   = new ProcessCompress(taskDefaultsContainer);
			this.dimensions = new ProcessDimensions(taskDefaultsContainer);
		}
	}
}
