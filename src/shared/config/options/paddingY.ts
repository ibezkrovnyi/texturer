import { BaseOption } from '../baseOption';

export class PaddingY extends BaseOption<number> {
  getValue(): number {
    return this._getPropertyValue('padding-y');
  }

  protected _hasDefaultValue(): boolean {
    return true;
  }

  protected _getDefaultValue(): number {
    return 0;
  }
}
