import { BaseOption } from '../baseOption';
import { GlobalConfig } from '../globalConfig';
import { CopyTask } from './copyTask';

class CopyTasksContainer extends BaseOption<Object[]> {
  getValue() {
    return this._getPropertyValue('copy-tasks');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue(): Object[] {
    return [];
  }
}

export class CopyTasks {
  private _globalConfig: GlobalConfig;
  private _configObject: Object;

  constructor(configObject: Object, globalConfig: GlobalConfig) {
    this._configObject = configObject;
    this._globalConfig = globalConfig;
  }

  getValue() {
    return new CopyTasksContainer(this._configObject).getValue().map(taskObject => new CopyTask(taskObject, this._globalConfig));
  }
}
