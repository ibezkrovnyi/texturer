import { BaseOption } from '../baseOption';

export class Templates extends BaseOption<string[]> {
  getValue() {
    return this._getPropertyValue('templates');
  }
}
