/*
 * Project: Texturer
 *
 * User: Igor Bezkrovny
 * Date: 18.10.2014
 * Time: 19:36
 * MIT LICENSE
 */
module Texturer {
	export class Dictionary {
		private _data : { [key : string] : any };

		constructor(serializedData?) {
			this._data = {};

			if (typeof serializedData !== 'undefined') {
				this._deserialize(serializedData);
			}
		}

		public setValue(key, value) {
			this._data[key] = value;
		}

		public getValue(key) {
			return this._data[key];
		}

		public addValue(key, value) {
			if (this.hasKey(key)) {
				this.getValue(key).push(value);
			} else {
				this.setValue(key, [value]);
			}
		}

		public hasKey(key) {
			return key in this._data;
		}

		/**
		 * @param {function(this:T, value: VALUE_TYPE, key: string, dictionary : Object.<string, VALUE_TYPE>)} callback
		 * @param {T} thisArg
		 * @template T, VALUE_TYPE
		 */
		public forEach(callback, thisArg) {
			for (var i in this._data) {
				if (this._data.hasOwnProperty(i)) {
					callback.call(thisArg, this._data[i], i, this._data);
				}
			}
		}

		public getSerialized() {
			return JSON.stringify(this._data);
		}

		private _deserialize(data) {
			this._data = JSON.parse(data);
		}
	}
}
