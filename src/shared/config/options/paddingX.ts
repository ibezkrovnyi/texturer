///<reference path="../baseOption.ts"/>
namespace Texturer.Config {

	export class PaddingX extends BaseOption<number> {
		getValue() : number {
			return this._getPropertyValue('padding-x');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : number {
			return 0;
		}
	}
}
