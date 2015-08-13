///<reference path="../baseOption.ts"/>
namespace Texturer.Config {

	export class ProcessCompressTinyPng extends BaseOption<boolean> {
		getValue() : boolean {
			return this._getPropertyValue('tiny-png');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : boolean {
			return false;
		}
	}

	class ProcessCompressContainer extends BaseOption<Object> {
		getValue() : Object {
			return this._getPropertyValue('compression');
		}
	}

	export class ProcessCompress {
		tinyPng : boolean;

		constructor(configObject : Object, inheritCompression : ProcessCompress = null) {
			let compression = new ProcessCompressContainer(configObject, null).getValue();

			if (inheritCompression) {
				this.tinyPng = new ProcessCompressTinyPng(compression, inheritCompression.tinyPng).getValue();
			} else {
				this.tinyPng = new ProcessCompressTinyPng(compression).getValue();
			}
		}
	}

}
