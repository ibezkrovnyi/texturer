import { BaseOption } from '../baseOption';

export class BruteForceTime extends BaseOption<number> {
  getValue(): number {
    return this._getPropertyValue('brute-force-time');
  }

  protected _hasDefaultValue(): boolean {
    return true;
  }

  protected _getDefaultValue(): number {
    return 0;
  }
}
