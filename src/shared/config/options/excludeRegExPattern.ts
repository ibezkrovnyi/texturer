import { BaseOption } from '../baseOption';

export class ExcludeRegExPattern extends BaseOption<string | null> {
  getValue() {
    return this._getPropertyValue('exclude');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return null;
  }
}
