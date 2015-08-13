///<reference path="../baseOption.ts"/>
namespace Texturer.Config {

	export class TextureMapFileName extends BaseOption<string> {
		private static _uniqueId : number = 0;

		getValue() : string {
			return this._getPropertyValue('texture-map-file');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : string {
			return 'textureMap' + (TextureMapFileName._uniqueId++) + '.png';
		}
	}
}
