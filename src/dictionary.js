function Dictionary(serializedData) {
	this._data = {};

	if(typeof serializedData !== 'undefined') {
		this._deserialize(serializedData);
	}
}

Dictionary.prototype = {
	setValue : function(key, value) {
		this._data[key] = value;
	},

	getValue : function(key) {
		return this._data[key];
	},

	addValue : function(key, value) {
		if (this.hasKey(key)) {
			this.getValue(key).push(value);
		} else {
			this.setValue(key, [ value ]);
		}
	},

	hasKey: function(key) {
		return key in this._data;
	},

	/**
	 * @param {function(this:T, value: VALUE_TYPE, key: string, dictionary : Object.<string, VALUE_TYPE>)} callback
	 * @param {T} thisArg
	 * @template T, VALUE_TYPE
	 */
	forEach: function(callback, thisArg) {
		for (var i in this._data) {
			if (this._data.hasOwnProperty(i)) {
				callback.call(thisArg, this._data[i], i, this._data);
			}
		}
	},

	getSerialized : function() {
		return JSON.stringify(this._data);
	},

	_deserialize : function(data) {
		this._data = JSON.parse(data);
	}
};

module.exports = Dictionary;
