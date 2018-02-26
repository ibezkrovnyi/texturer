import { BaseOption } from '../baseOption';

export class TextureMapFileName extends BaseOption<string> {
  private static _uniqueId = 0;

  getValue() {
    return this._getPropertyValue('texture-map-file');
  }

  protected _hasDefaultValue() {
    return true;
  }

  protected _getDefaultValue() {
    return 'textureMap' + (TextureMapFileName._uniqueId++) + '.png';
  }
}
