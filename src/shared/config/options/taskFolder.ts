import { BaseOption } from '../baseOption';

export class TaskFolder extends BaseOption<string> {
  getValue() {
    return this._getPropertyValue('folder');
  }
}
