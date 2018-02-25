import { BaseOption } from '../baseOption';

export class TaskFolder extends BaseOption<string> {
  getValue(): string {
    return this._getPropertyValue('folder');
  }
}
