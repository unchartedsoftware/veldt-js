'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');
const Request = require('../request/Request');

const TILE_ADD = Symbol();
const REDRAW_DEBOUNCE = Symbol();
const REDRAW_TIMEOUT_MS = 800;

/**
 * Base TileLayer class.
 */
class Base extends lumo.TileLayer {

	/**
	 * Instantiates a base tile layer.
	 *
	 * @param {Object} options - The options parameter.
	 * @param {string} options.pipeline - The pipeline string id.
	 * @param {string} options.uri - The layer uri.
	 * @param {bool} options.xyz - Whether to use XYZ tile coords instead of TMS.
	 * @param {Function} options.transform - The transform applied to the tile data.
	 */
	constructor(options = {}) {
		super(options);
		this.pipeline = defaultTo(options.pipeline, '');
		this.uri = defaultTo(options.uri, '');
		this.xyz = defaultTo(options.xyz, false);
		this.transform = defaultTo(options.transform, null);
		this[REDRAW_DEBOUNCE] = null;
		this.clearExtrema();
	}

	/**
	 * Set the pipeline string id.
	 *
	 * @param {string} pipeline - The pipeline string id.
	 */
	setPipeline(pipeline) {
		this.pipeline = pipeline;
	}

	/**
	 * Set the layer uri.
	 *
	 * @param {string} uri - The layer uri.
	 */
	setURI(uri) {
		this.uri = uri;
	}

	/**
	 * Set the layer requestor object.
	 *
	 * @param {Requestor} requestor - The requestor object.
	 */
	setRequestor(requestor) {
		this.requestTile = Request.requestJSON(requestor);
	}

	/**
	 * Use XYZ tile coordinates when requesting tiles.
	 */
	useXYZ() {
		this.xyz = true;
	}

	/**
	 * Use TMS tile coordinates when requesting tiles.
	 */
	useTMS() {
		this.xyz = false;
	}

	/**
	 * Executed when the layer is added to the plot.
	 *
	 * @param {Plot} plot - The plot object.
	 */
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
	}

	/**
	 * Executed when the layer is removed from the plot.
	 *
	 * @param {Plot} plot - The plot object.
	 */
	onRemove(plot) {
		// clear any pending timeout
		clearTimeout(this[REDRAW_DEBOUNCE]);
		this[REDRAW_DEBOUNCE] = null;
		// detach handler
		this.removeListener(lumo.TILE_ADD, this[TILE_ADD]);
		// delete handler
		this[TILE_ADD] = null;
		super.onRemove(plot);
	}

	/**
	 * Clears tracked extrema data.
	 */
	clearExtrema() {
		this.extremas = new Map();
	}

	/**
	 * Returns the tracked extrema data for the given level.
	 *
	 * @param {number} level - The zoom level to query.
	 *
	 * @returns {Object} The extrema.
	 */
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

	/**
	 * Given a tile coord and tile data payload, extract the extrema and track
	 * it for the level.
	 *
	 * @param {TileCoord} coord - The tile coord.
	 * @param {Object} data - The tile data.
	 *
	 * @returns {bool} Whether or not the tracked extrema was updated.
	 */
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

	/**
	 * Overridable method for extracting the extrema values based on the tile
	 * format.
	 */
	extractExtrema() {
		return {
			min: Infinity,
			max: -Infinity
		};
	}

}

module.exports = Base;
