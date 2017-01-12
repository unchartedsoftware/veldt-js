'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');
const isEmpty = require('lodash/isEmpty');
const isFunction = require('lodash/isFunction');

const REDRAW_TIMEOUT_MS = 800;

class Live extends lumo.Layer {

	constructor(meta, options = {}) {
		super(options);
		this.meta = meta;
		this.params = {};
		this.query = null;
		this.transform = defaultTo(options.transform, null);
		this.redrawDebounce = null;
		this.on(lumo.TILE_ADD, event => {
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
		});
		// set extrema / cache
		this.clearExtrema();
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

	setQuery(query) {
		if (isEmpty(query) && !isFunction(query)) {
			throw 'Query object is empty';
		}
		this.query = query;
		this.clearExtrema();
	}

	getQuery() {
		if (isEmpty(this.query) && !isFunction(this.query)) {
			return null;
		}
		return isFunction(this.query) ? this.query() : this.query;
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
