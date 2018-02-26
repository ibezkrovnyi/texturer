import { BaseOption } from '../baseOption';

export class PaddingY extends BaseOption<number> {
  getValue() {
    return this._getPropertyValue('padding-y');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return 0;
  }
}
