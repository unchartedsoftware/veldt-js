'use strict';

const EventEmitter = require('events');
const defaultTo = require('lodash/defaultTo');

/**
 * Group layer acts as an interface for making changes across multiple layers
 * in unison. The group layer itself is empty and acts as a proxy interface. all
 * layers will still be individually added to the map.
 *
 * While individual properties of each child layer may differ (zIndex,
 * visibility, etc), any setter / getter methods of the group will be applied
 * to all children.
 */
class Group extends EventEmitter {

	constructor(options = {}) {
		super();
		this.layers = defaultTo(options.layers, []);
	}

	onAdd(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		this.plot = plot;
		this.layers.forEach(layer => {
			plot.add(layer);
		});
		return this;
	}

	onRemove(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		this.layers.forEach(layer => {
			plot.remove(layer);
		});
		this.plot = null;
		return this;
	}

	add(layer) {
		if (!layer) {
			throw 'No layer argument provided';
		}
		if (this.layers.indexOf(layer) !== -1) {
			throw 'Provided layer is already attached to the group';
		}
		this.layers.push(layer);
		if (this.plot) {
			this.plot.addLayer(layer);
		}
		return this;
	}

	remove(layer) {
		if (!layer) {
			throw 'No layer argument provided';
		}
		const index = this.layers.indexOf(layer);
		if (index === -1) {
			throw 'Provided layer is not attached to the group';
		}
		this.layers.splice(index, 1);
		if (this.plot) {
			this.plot.removeLayer(layer);
		}
		return this;
	}

	has(layer) {
		const index = this.layers.indexOf(layer);
		return index !== -1;
	}

	show() {
		this.layers.forEach(layer => {
			layer.show();
		});
	}

	hide() {
		this.layers.forEach(layer => {
			layer.hide();
		});
	}

	isHidden() {
		return true;
	}

	mute() {
		this.layers.forEach(layer => {
			layer.mute();
		});
	}

	unmute() {
		this.layers.forEach(layer => {
			layer.unmute();
		});
	}

	isMuted() {
		return true;
	}

	enable() {
		this.show();
		this.unmute();
	}

	disable() {
		this.hide();
		this.mute();
	}

	isDisabled() {
		return true;
	}

	/**
	 *
	 * @param index
	 * @param doSpread - if true, increase the zIndex for each child.
     */
	setZIndex(index, doSpread) {
		let spread = 0;
		this.layers.forEach(layer => {
			layer.setZIndex(index + spread);
			if (doSpread) {
				spread = spread + 1;
			}
		});
	}

	getZIndex() {
		return 0.0;
	}

	setOpacity(opacity) {
		this.layers.forEach(layer => {
			layer.setOpacity(opacity);
		});
	}

	getOpacity() {
		return 0.0;
	}

	isFiltered() {
		return false;
	}

	addFilter(id, filter) {
		this.layers.forEach(layer => {
			layer.addFilter(id, filter);
		});
	}

	removeFilter(id) {
		this.layers.forEach(layer => {
			layer.removeFilter(id);
		});
	}

	clearFilters() {
		this.layers.forEach(layer => {
			layer.clearFilters();
		});
	}

	setQuery(query) {
		this.layers.forEach(layer => {
			layer.setQuery(query);
		});
	}

	clearQuery() {
		this.layers.forEach(layer => {
			layer.clearQuery();
		});
	}

	refresh() {
		this.layers.forEach(layer => {
			layer.refresh();
		});
	}

	draw() {
		// no-op
	}

	pick() {
		// no-op
	}

	requestTiles() {
		// no-op
	}
}

module.exports = Group;
