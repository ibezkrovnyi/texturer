///<reference path="../baseOption.ts"/>
namespace Texturer.Config {

	export class Templates extends BaseOption<string[]> {
		getValue() : string[] {
			return this._getPropertyValue('templates');
		}
	}
}
