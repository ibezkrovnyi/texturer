///<reference path="../baseOption.ts"/>
namespace Texturer.Config {

	export class ExcludeRegExPattern extends BaseOption<string> {
		getValue() : string {
			return this._getPropertyValue('exclude');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : string {
			return null;
		}
	}
}
