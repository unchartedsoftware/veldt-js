'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');
const isEmpty = require('lodash/isEmpty');
const isFunction = require('lodash/isFunction');

const $ = require('jquery');

const TILE_ADD = Symbol();

const REDRAW_TIMEOUT_MS = 800;

class Live extends lumo.Layer {

	constructor(meta, options = {}) {
		super(options);
		this.meta = meta;
		this.params = {};
		this.query = null;
		this.filters = new Map();
		this.transform = defaultTo(options.transform, null);
		this.redrawDebounce = null;
		this.handlers = new Map();
		// set extrema / cache
		this.clearExtrema();
	}

	onAdd(plot) {
		// create handler
		const add = event => {
			if (this.transform) {
				event.tile.data = this.transform(event.tile.data);
			}
			const updated = this.updateExtrema(event.tile.coord, event.tile.data);
			if (updated && this.renderer && this.renderer.redraw) {
				clearTimeout(this.redrawDebounce);
				this.redrawDebounce = setTimeout(() => {
					if (this.renderer && this.renderer.redraw) {
						this.renderer.redraw(true);
					}
					// clear debounce
					this.redrawDebounce = null;
				}, REDRAW_TIMEOUT_MS);
			}
		};
		// attach handler
		// NOTE: add this BEFORE calling super, this NEEDS to be the first
		// `TILE_ADD` callback.
		this.on(lumo.TILE_ADD, add);
		// store handler
		this.handlers.set(TILE_ADD, add);
		super.onAdd(plot);
		return this;
	}

	onRemove(plot) {
		// clear any pending timeout
		clearTimeout(this.redrawDebounce);
		this.redrawDebounce = null;
		// detach handler
		this.removeListener(lumo.TILE_ADD, this.handlers.get(TILE_ADD));
		// delete handler
		this.handlers.delete(TILE_ADD);
		super.onRemove(plot);
		return this;
	}

	clearExtrema() {
		this.extremas = new Map();
	}

	getExtrema(level = Math.round(this.plot.zoom)) {
		let extrema = null;
		if (!this.extremas.has(level)) {
			extrema = {
				min: Infinity,
				max: -Infinity
			};
			this.extremas.set(level, extrema);
		} else {
			extrema = this.extremas.get(level);
		}
		return extrema;
	}

	updateExtrema(coord, data) {
		const current = this.getExtrema(coord.z);
		const extrema = this.extractExtrema(data);
		let changed = false;
		if (extrema.min < current.min) {
			changed = true;
			current.min = extrema.min;
		}
		if (extrema.max > current.max) {
			changed = true;
			current.max = extrema.max;
		}
		return changed;
	}

	extractExtrema() {
		return {
			min: Infinity,
			max: -Infinity
		};
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

	getParams() {
		return this.params;
	}

	postUpdate() {
		const $dc = $('.deconfliction-collider');
		const tree = new lumo.RTree({
				collisionType: lumo.RECTANGLE,
				nodeCapacity: 32
			});

		$dc.sort(function(a,b){
			const sizeA = $(a).outerHeight();
			const sizeB = $(b).outerHeight();
			if(sizeA < sizeB) {
				return 1
			}else if(sizeA > sizeB) {
				return -1;
			}
			return 0;
		});

		$dc.each(function(index, element){
			const $e = $(element);
			const position = $e.offset();
			const w = $e.width();
			const h = $e.height();
			const point = {
				'minX': position.left,
				'maxX': position.left + w,
				'minY': position.top,
				'maxY': position.top + h
			}

			if(tree.searchRectangle(point.minX, point.maxX, point.minY, point.maxY) !== null) {
				$(element).css('visibility', 'hidden');
			} else {
				tree.insert([point]);
			}
		});
	}
}

module.exports = Live;
