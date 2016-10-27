'use strict';

const METRICS = {
	'min': true,
	'max': true,
	'sum': true,
	'avg': true
};

const checkField = function(meta, field) {
	if (meta) {
		if (!meta.extrema) {
			throw 'Metric `field` ' + field + ' is not ordinal in meta data';
		}
	} else {
		throw 'Metric `field` ' + field + ' is not recognized in meta data';
	}
};

const setMetric = function(field, type) {
	if (!field) {
		throw 'Metric `field` is missing from argument';
	}
	if (!type) {
		throw 'Metric `type` is missing from argument';
	}
	checkField(this._meta[field], field);
	if (!METRICS[type]) {
		throw 'Metric type `' + type + '` is not supported';
	}
	this._params.metric = {
		field: field,
		type: type
	};
	this.clearExtrema();
	return this;
};

const getMetric = function() {
	return this._params.metric;
};

module.exports = {
	// tiling
	setMetric: setMetric,
	getMetric: getMetric,
};
