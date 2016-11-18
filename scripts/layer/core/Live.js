'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');
const isEmpty = require('lodash/isEmpty');

class Live extends lumo.Layer {

	constructor(meta, options = {}) {
		super(options);
		this.meta = meta;
		this.params = {};
		this.query = null;
		this.transform = defaultTo(options.transform, x => x);
		// set extrema / cache
		this.clearExtrema();
	}

	clearExtrema() {
		this.extrema = {
			min: Number.MAX_VALUE,
			max: 0
		};
	}

	getExtrema() {
		return this.extrema;
	}

	updateExtrema(data) {
		const extrema = this.extractExtrema(data);
		let changed = false;
		if (extrema.min < this.extrema.min) {
			changed = true;
			this.extrema.min = extrema.min;
		}
		if (extrema.max > this.extrema.max) {
			changed = true;
			this.extrema.max = extrema.max;
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
		if (isEmpty(query)) {
			throw 'Query object is empty';
		}
		this.query = query;
		this.clearExtrema();
	}

	getQuery() {
		if (isEmpty(this.query)) {
			return null;
		}
		return this.query;
	}

	clearQuery() {
		this.query = undefined;
		this.clearExtrema();
	}

	getMeta() {
		return this.meta;
	}

	getParams() {
		return this.params;
	}
}

module.exports = Live;
