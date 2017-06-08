'use strict';

const isEmpty = require('lodash/isEmpty');
const isFunction = require('lodash/isFunction');
const Base = require('./Base');

/**
 * A live layer represents a dynamic tile layer whos tile data is generated
 * on-demond rather than statically.
 */
class Live extends Base {

	/**
	 * Instantiates a live layer.
	 *
	 * @param {Object} options - The options parameter.
	 */
	constructor(options = {}) {
		super(options);
		this.query = null;
		this.filters = new Map();
	}

	/**
	 * Adds a filter under the provided id. All filters are implicitly AND'd
	 * together and AND'd to the query.
	 *
	 * @param {Symbol|string} id - The id to store the filter.
	 * @param {Object} filter - The filter object.
	 */
	addFilter(id, filter) {
		this.filters.set(id, filter);
		this.clearExtrema();
	}

	/**
	 * Removes a filter under the provided id.
	 *
	 * @param {Symbol|string} id - The id of the filter to remove.
	 */
	removeFilter(id) {
		if (this.filters.has(id)) {
			this.filters.delete(id);
			this.clearExtrema();
		}
	}

	/**
	 * Whether or not there are any filters for the layer.
	 *
	 * @returns {bool} Whether or not there are any filters.
	 */
	isFiltered() {
		return this.filters.size > 0;
	}

	/**
	 * Remove all filters from the layer.
	 */
	clearFilters() {
		this.filters.clear();
	}

	/**
	 * Set the query for the layer.
	 *
	 * @param {Object} query - The query object.
	 */
	setQuery(query) {
		if (isEmpty(query) && !isFunction(query)) {
			throw 'Query object is empty';
		}
		this.query = query;
		this.clearExtrema();
	}

	/**
	 * Returns the final query for the layer. This includes all filters AND'd
	 * together and AND'd to the query.
	 */
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

	/**
	 * Remove the query from the layer.
	 */
	clearQuery() {
		this.query = undefined;
		this.clearExtrema();
	}

}

module.exports = Live;
