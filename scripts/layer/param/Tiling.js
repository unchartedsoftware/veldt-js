'use strict';

const DEFAULT_X_FIELD = 'pixel.x';
const DEFAULT_Y_FIELD = 'pixel.y';
const DEFAULT_PIXEL_MIN = 0;
const DEFAULT_PIXEL_MAX = Math.pow(2, 32);

const checkField = function(meta, field) {
	if (meta) {
		if (meta.extrema) {
			return true;
		} else {
			throw 'Field `' + field + '` is not ordinal in meta data.';
		}
	} else {
		throw 'Field `' + field + '` is not recognized in meta data.';
	}
	return false;
};

const setXField = function(field, type, relationship) {
	if (field !== this._params.binning.x) {
		if (field.indexOf(DEFAULT_X_FIELD) !== -1) {
			// reset if default
			this._params.binning.x = field;
			this._params.binning.left = DEFAULT_PIXEL_MIN;
			this._params.binning.right = DEFAULT_PIXEL_MAX;
			this.clearExtrema();
		} else {
			const meta = this._meta[field];
			if (checkField(meta, field)) {
				this._params.binning.x = field;
				this._params.binning.left = meta.extrema.min;
				this._params.binning.right = meta.extrema.max;
				this.clearExtrema();
			}
		}
	}
	this._params.binning.xType = type;
	this._params.binning.xRelationship = relationship;
	return this;
};

const getXField = function() {
	return this._params.binning.x;
};

const setYField = function(field, type, relationship) {
	if (field !== this._params.binning.y) {
		if (field.indexOf(DEFAULT_Y_FIELD) !== -1) {
			// reset if default
			this._params.binning.y = field;
			this._params.binning.bottom = DEFAULT_PIXEL_MAX;
			this._params.binning.top = DEFAULT_PIXEL_MIN;
			this.clearExtrema();
		} else {
			const meta = this._meta[field];
			if (checkField(meta, field)) {
				this._params.binning.y = field;
				this._params.binning.bottom = meta.extrema.min;
				this._params.binning.top = meta.extrema.max;
				this.clearExtrema();
			}
		}
	}
	this._params.binning.yType = type;
	this._params.binning.yRelationship = relationship;
	return this;
};

const getYField = function() {
	return this._params.binning.y;
};

module.exports = {
	setXField: setXField,
	getXField: getXField,
	setYField: setYField,
	getYField: getYField,
	DEFAULT_X_FIELD: DEFAULT_X_FIELD,
	DEFAULT_Y_FIELD: DEFAULT_Y_FIELD,
	DEFAULT_PIXEL_MAX: DEFAULT_PIXEL_MAX
};
