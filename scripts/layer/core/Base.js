'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');
const Request = require('../request/Request');

const TILE_ADD = Symbol();
const REDRAW_DEBOUNCE = Symbol();
const REDRAW_TIMEOUT_MS = 800;

class Base extends lumo.TileLayer {

	constructor(options = {}) {
		super(options);
		this.pipeline = defaultTo(options.pipeline, '');
		this.uri = defaultTo(options.uri, '');
		this.xyz = defaultTo(options.xyz, false);
		this.transform = defaultTo(options.transform, null);
		this[REDRAW_DEBOUNCE] = null;
		this.clearExtrema();
	}

	setPipeline(pipeline) {
		this.pipeline = pipeline;
	}

	setURI(uri) {
		this.uri = uri;
	}

	setRequestor(requestor) {
		this.requestTile = Request.requestJSON(requestor);
	}

	useXYZ() {
		this.xyz = true;
	}

	useTMS() {
		this.xyz = false;
	}

	onAdd(plot) {
		// create handler
		this[TILE_ADD] = event => {
			if (this.transform) {
				event.tile.data = this.transform(event.tile.data);
			}
			const updated = this.updateExtrema(event.tile.coord, event.tile.data);
			if (updated && this.renderer && this.renderer.redraw) {
				clearTimeout(this[REDRAW_DEBOUNCE]);
				this[REDRAW_DEBOUNCE] = setTimeout(() => {
					if (this.renderer && this.renderer.redraw) {
						this.renderer.redraw(true);
					}
					// clear debounce
					this[REDRAW_DEBOUNCE] = null;
				}, REDRAW_TIMEOUT_MS);
			}
		};
		// attach handler
		// NOTE: add this BEFORE calling super, this NEEDS to be the first
		// `TILE_ADD` callback.
		this.on(lumo.TILE_ADD, this[TILE_ADD]);
		super.onAdd(plot);
		return this;
	}

	onRemove(plot) {
		// clear any pending timeout
		clearTimeout(this[REDRAW_DEBOUNCE]);
		this[REDRAW_DEBOUNCE] = null;
		// detach handler
		this.removeListener(lumo.TILE_ADD, this[TILE_ADD]);
		// delete handler
		this[TILE_ADD] = null;
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
