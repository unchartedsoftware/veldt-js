'use strict';

const setDateHistogram = function(field, fromTimestamp, toTimestamp, interval) {
	if (!field) {
		throw 'DateHistogram `field` is missing from argument';
	}
	this._params.date_histogram = {
		field: field,
		from: fromTimestamp,
		to: toTimestamp,
		interval: interval
	};
	this.clearExtrema();
	return this;
};

const getDateHistogram = function() {
	return this._params.date_histogram;
};

module.exports = {
	setDateHistogram: setDateHistogram,
	getDateHistogram: getDateHistogram
};
