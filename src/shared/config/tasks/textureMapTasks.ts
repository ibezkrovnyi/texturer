///<reference path="../baseOption.ts"/>
///<reference path="textureMapTask.ts"/>
namespace Texturer.Config {

	class TextureMapTasksContainer extends BaseOption<Object[]> {
		getValue() : Object[] {
			return this._getPropertyValue('texture-map-tasks');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : Object[] {
			return [];
		}
	}

	export class TextureMapTasks {
		private _globalConfig : GlobalConfig;
		private _configObject : Object;

		constructor(configObject : Object, globalConfig : GlobalConfig) {
			this._configObject = configObject;
			this._globalConfig = globalConfig;
		}

		getValue() : TextureMapTask[] {
			return new TextureMapTasksContainer(this._configObject).getValue().map(taskObject => new TextureMapTask(taskObject, this._globalConfig));
		}
	}
}
