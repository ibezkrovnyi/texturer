///<reference path="../baseOption.ts"/>
namespace Texturer.Config {

	export class ProcessDimensionsContainer extends BaseOption<Object> {
		getValue() : Object {
			return this._getPropertyValue('dimensions');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : boolean {
			return null;
		}
	}

	export class ProcessDimensionsMaxX extends BaseOption<number> {
		getValue() : number {
			return this._getPropertyValue('max-x');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : number {
			return 1920;
		}
	}

	export class ProcessDimensionsMaxY extends BaseOption<number> {
		getValue() : number {
			return this._getPropertyValue('max-y');
		}

		protected _hasDefaultValue() : boolean {
			return true;
		}

		protected _getDefaultValue() : number {
			return 1080;
		}
	}

	export class ProcessDimensions {
		maxX : number;
		maxY : number;

		constructor(configObject : Object, inheritDimensions : ProcessDimensions = null) {
			const dimensionsContainer = new ProcessDimensionsContainer(configObject).getValue();
			if (inheritDimensions) {
				this.maxX = new ProcessDimensionsMaxX(dimensionsContainer, inheritDimensions.maxX).getValue();
				this.maxY = new ProcessDimensionsMaxY(dimensionsContainer, inheritDimensions.maxY).getValue();
			} else {
				this.maxX = new ProcessDimensionsMaxX(dimensionsContainer).getValue();
				this.maxY = new ProcessDimensionsMaxY(dimensionsContainer).getValue();
			}
		}
	}
}
