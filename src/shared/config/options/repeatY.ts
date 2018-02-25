import { BaseOption } from '../baseOption';

export class RepeatY extends BaseOption<boolean> {
  getValue(): boolean {
    return this._getPropertyValue('repeat-y');
  }

  protected _hasDefaultValue(): boolean {
    return true;
  }

  protected _getDefaultValue(): boolean {
    return false;
  }
}
