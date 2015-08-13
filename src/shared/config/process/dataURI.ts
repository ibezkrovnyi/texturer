///<reference path="../baseOption.ts"/>
namespace Texturer.Config {

	class ProcessDataURIEnable extends BaseOption<boolean> {
		getValue() : boolean {
			return this._getPropertyValue('enable');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : boolean {
			return true;
		}
	}

	class ProcessDataURIMaxSize extends BaseOption<number> {
		getValue() : number {
			return this._getPropertyValue('max-size');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : number {
			// Opera 11 limitation = 65000 characters
			return 32 * 1024 - 256;
		}
	}

	class ProcessDataURICreateImageFileAnyway extends BaseOption<boolean> {
		getValue() : boolean {
			return this._getPropertyValue('create-image-file-anyway');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : boolean {
			return false;
		}
	}

	class ProcessDataURIContainer extends BaseOption<Object> {
		getValue() : Object {
			return this._getPropertyValue('data-uri');
		}
	}

	export class ProcessDataURI {
		enable : boolean;
		maxSize : number;
		createImageFileAnyway : boolean;

		constructor(configObject : Object, inheritDataURI : ProcessDataURI = null) {
			let dataURI = new ProcessDataURIContainer(configObject, null).getValue();
			if (inheritDataURI) {
				this.enable                = new ProcessDataURIEnable(dataURI, inheritDataURI.enable).getValue();
				this.maxSize               = new ProcessDataURIMaxSize(dataURI, inheritDataURI.maxSize).getValue();
				this.createImageFileAnyway = new ProcessDataURICreateImageFileAnyway(dataURI, inheritDataURI.createImageFileAnyway).getValue();
			} else {
				this.enable                = new ProcessDataURIEnable(dataURI).getValue();
				this.maxSize               = new ProcessDataURIMaxSize(dataURI).getValue();
				this.createImageFileAnyway = new ProcessDataURICreateImageFileAnyway(dataURI).getValue();
			}
		}
	}

}
