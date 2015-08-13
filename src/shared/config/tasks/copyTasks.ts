///<reference path="../baseOption.ts"/>
///<reference path="../globalConfig.ts"/>
namespace Texturer.Config {

	class CopyTasksContainer extends BaseOption<Object[]> {
		getValue() : Object[] {
			return this._getPropertyValue('copy-tasks');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : Object[] {
			return [];
		}
	}

	export class CopyTasks {
		private _globalConfig : GlobalConfig;
		private _configObject : Object;

		constructor(configObject : Object, globalConfig : GlobalConfig) {
			this._configObject = configObject;
			this._globalConfig = globalConfig;
		}

		getValue() : CopyTask[] {
			return new CopyTasksContainer(this._configObject).getValue().map(taskObject => new CopyTask(taskObject, this._globalConfig));
		}
	}
}
