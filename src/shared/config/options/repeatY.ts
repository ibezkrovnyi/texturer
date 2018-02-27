import { BaseOption } from '../baseOption';

export class RepeatY extends BaseOption<boolean> {
  getValue() {
    return this._getPropertyValue('repeat-y');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return false;
  }
}
