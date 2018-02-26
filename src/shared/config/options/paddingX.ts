import { BaseOption } from '../baseOption';

export class PaddingX extends BaseOption<number> {
  getValue() {
    return this._getPropertyValue('padding-x');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return 0;
  }
}
