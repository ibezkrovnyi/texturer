namespace Texturer.Config {

	export class BaseOption<T> {
		private _configObject : Object;
		private _inheritValue : T;
		private _hasInheritValue : boolean;

		constructor(configObject : Object, inheritValue? : T) {
			this._configObject    = configObject || {};
			this._inheritValue    = inheritValue;
			this._hasInheritValue = arguments.length >= 2;
		}

		// TODO: make abstract when WebStorm will support it
		getValue() : T {
			throw new Error("BaseOption#getValue: this method is abstract");
		}

		protected _hasDefaultValue() : boolean {
			return false;
		}

		protected _getDefaultValue() : T {
			throw new Error("BaseOption#_getDefaultValue: this method is abstract");
		}

		protected _getPropertyValue(propertyName : string) : T {
			if (this._configObject && typeof this._configObject === 'object' && this._configObject.hasOwnProperty(propertyName)) {
				return this._configObject[ propertyName ];
			}

			if (this._hasInheritValue) {
				return this._inheritValue;
			}

			if (this._hasDefaultValue()) {
				return this._getDefaultValue();
			}

			throw new Error(`BaseOption#_getPropertyValue: property name '${propertyName}' not found in config`);
		}
	}
}
