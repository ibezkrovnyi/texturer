import { BaseOption } from '../baseOption';

export class Templates extends BaseOption<string[]> {
  getValue(): string[] {
    return this._getPropertyValue('templates');
  }
}
