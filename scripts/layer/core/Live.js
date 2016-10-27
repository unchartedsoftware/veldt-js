'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');
const boolQueryCheck = require('../query/Bool');

class Live extends lumo.Layer {

	constructor(meta, options = {}) {
		super(options);
		this._meta = meta;
		this._params = {
			binning: {}
		};
		this._transform = defaultTo(options.transform, x => x);
		// set extrema / cache
		this.clearExtrema();
	}

	clearExtrema() {
		this._extrema = {
			min: Number.MAX_VALUE,
			max: 0
		};
	}

	getExtrema() {
		return this._extrema;
	}

	updateExtrema(data) {
		const extrema = this.extractExtrema(data);
		let changed = false;
		if (extrema.min < this._extrema.min) {
			changed = true;
			this._extrema.min = extrema.min;
		}
		if (extrema.max > this._extrema.max) {
			changed = true;
			this._extrema.max = extrema.max;
		}
		return changed;
	}

	extractExtrema() {
		return {
			min: Infinity,
			max: -Infinity
		};
	}

	setQuery(query) {
		if (!query.must && !query.must_not && !query.should) {
			throw 'Root query must have at least one `must`, `must_not`, or `should` argument.';
		}
		// check that the query is valid
		boolQueryCheck(this._meta, query);
		// set query
		this._params.must = query.must;
		this._params.must_not = query.must_not;
		this._params.should = query.should;
		// cleat extrema
		this.clearExtrema();
	}

	getQuery() {
		return {
			must: this._params.must,
			must_not: this._params.must_not,
			should: this._params.should,
		};
	}

	clearQuery() {
		// clear query
		this._params.must = undefined;
		this._params.must_not = undefined;
		this._params.should = undefined;
		// cleat extrema
		this.clearExtrema();
	}

	getMeta() {
		return this._meta;
	}

	getParams() {
		return this._params;
	}

	setDateHistogram(field, fromTimestamp, toTimestamp, interval) {
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
	}

	getDateHistogram() {
		return this._params.date_histogram;
	}

	setHistogram(field, interval) {
		if (!field) {
			throw 'Histogram `field` is missing from argument';
		}
		if (!interval) {
			throw 'Histogram `interval` are missing from argument';
		}
		const meta = this._meta[field];
		if (meta) {
			if (!meta.extrema) {
				throw 'Histogram `field` ' + field + ' is not ordinal in meta data';
			}
		} else {
			throw 'Histogram `field` ' + field + ' is not recognized in meta data';
		}
		this._params.histogram = {
			field: field,
			interval: interval
		};
		this.clearExtrema();
		return this;
	}

	getHistogram () {
		return this._params.histogram;
	}

	setMetric(field, type) {
		if (!field) {
			throw 'Metric `field` is missing from argument';
		}
		if (!type) {
			throw 'Metric `type` is missing from argument';
		}
		const meta = this._meta[field];
		if (meta) {
			if (!meta.extrema) {
				throw 'Metric `field` ' + field + ' is not ordinal in meta data';
			}
		} else {
			throw 'Metric `field` ' + field + ' is not recognized in meta data';
		}
		const METRICS = {
			'min': true,
			'max': true,
			'sum': true,
			'avg': true
		};
		if (!METRICS[type]) {
			throw 'Metric type `' + type + '` is not supported';
		}
		this._params.metric = {
			field: field,
			type: type
		};
		this.clearExtrema();
		return this;
	}

	getMetric() {
		return this._params.metric;
	}
}

module.exports = Live;
