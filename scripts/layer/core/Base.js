'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');

const TILE_ADD = Symbol();
const REDRAW_TIMEOUT_MS = 800;

class Base extends lumo.Layer {

	constructor(options = {}) {
		super(options);
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

}

module.exports = Base;
