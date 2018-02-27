import { BaseOption } from '../baseOption';

export class GridStep extends BaseOption<number> {
  getValue() {
    return this._getPropertyValue('grid-step');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return 1;
  }
}
