'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');
const isEmpty = require('lodash/isEmpty');
const isFunction = require('lodash/isFunction');
const Base = require('./Base');

class Live extends Base {

	constructor(meta, options = {}) {
		super(options);
		this.meta = meta;
		this.query = null;
		this.filters = new Map();
	}

	addFilter(id, filter) {
		this.filters.set(id, filter);
		this.clearExtrema();
	}

	removeFilter(id) {
		if (this.filters.has(id)) {
			this.filters.delete(id);
			this.clearExtrema();
		}
	}

	clearFilters() {
		this.filters.clear();
	}

	setQuery(query) {
		if (isEmpty(query) && !isFunction(query)) {
			throw 'Query object is empty';
		}
		this.query = query;
		this.clearExtrema();
	}

	getQuery() {
		if (isEmpty(this.query) &&
			!isFunction(this.query) &&
			this.filters.size === 0) {
			// no query / filters
			return null;
		}
		let query = isFunction(this.query) ? this.query(this) : this.query || [];
		if (!Array.isArray(query)) {
			query = [query];
		}
		this.filters.forEach(filter => {
			if (query.length > 0) {
				query.push('AND');
			}
			query.push(isFunction(filter) ? filter(this) : filter);
		});
		return query;
	}

	clearQuery() {
		this.query = undefined;
		this.clearExtrema();
	}

	getMeta() {
		return this.meta;
	}

	//getParams() {
	//	return this.params;
	//}
}

module.exports = Live;
