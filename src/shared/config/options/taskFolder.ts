///<reference path="../baseOption.ts"/>
namespace Texturer.Config {

	export class TaskFolder extends BaseOption<string> {
		getValue() : string {
			return this._getPropertyValue('folder');
		}
	}
}
