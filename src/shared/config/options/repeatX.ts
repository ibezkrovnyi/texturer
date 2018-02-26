import { BaseOption } from '../baseOption';

export class RepeatX extends BaseOption<boolean> {
  getValue() {
    return this._getPropertyValue('repeat-x');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return false;
  }
}
