import { BaseOption } from '../baseOption';

export class BruteForceTime extends BaseOption<number> {
  getValue() {
    return this._getPropertyValue('brute-force-time');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return 0;
  }
}
