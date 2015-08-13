///<reference path="../baseOption.ts"/>
namespace Texturer.Config {

	export class RepeatY extends BaseOption<boolean> {
		getValue() : boolean {
			return this._getPropertyValue('repeat-y');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : boolean {
			return false;
		}
	}
}
