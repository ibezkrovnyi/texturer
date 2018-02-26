import { GlobalConfig } from '../globalConfig';
import { BaseOption } from '../baseOption';
import { TextureMapTask } from './textureMapTask';

class TextureMapTasksContainer extends BaseOption<Object[]> {
  getValue() {
    return this._getPropertyValue('texture-map-tasks');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue(): Object[] {
    return [];
  }
}

export class TextureMapTasks {
  private _globalConfig: GlobalConfig;
  private _configObject: Object;

  constructor(configObject: Object, globalConfig: GlobalConfig) {
    this._configObject = configObject;
    this._globalConfig = globalConfig;
  }

  getValue() {
    return new TextureMapTasksContainer(this._configObject).getValue().map(taskObject => new TextureMapTask(taskObject, this._globalConfig));
  }
}
