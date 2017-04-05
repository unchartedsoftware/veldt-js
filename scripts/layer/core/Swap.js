'use strict';

const lumo = require('lumo');
const EventEmitter = require('events');
const defaultTo = require('lodash/defaultTo');
const reduce = require('lodash/reduce');

const broadcast = function(swap, type) {
	const handler = event => {
		swap.layers.forEach(layer => {
			layer.emit(type, event);
		});
	};
	swap.on(type, handler);
	swap.broadcasts.set(type, handler);
};

const unbroadcast = function(swap, type) {
	const handler = swap.broadcasts.get(type);
	swap.removeListener(type, handler);
	swap.broadcasts.delete(type);
};

class Swap extends EventEmitter {

	constructor(swap, options = {}) {
		super();
		if (!swap) {
			throw '\'swap\' argument is missing';
		}
		this.swap = swap;
		this.hidden = defaultTo(options.hidden, false);
		this.muted = defaultTo(options.muted, false);
		this.opacity = defaultTo(options.opacity, 1.0);
		this.zIndex = defaultTo(options.zIndex, 0);
		this.layers = defaultTo(options.layers, []);
		this.layers.unshift(swap);
		this.broadcasts = new Map();
	}

	onAdd(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		this.plot = plot;
		this.layers.forEach(layer => {
			layer.onAdd(this.plot);
		});
		broadcast(this, lumo.PAN_START);
		broadcast(this, lumo.PAN);
		broadcast(this, lumo.PAN_END);
		broadcast(this, lumo.ZOOM_START);
		broadcast(this, lumo.ZOOM);
		broadcast(this, lumo.ZOOM_END);
		return this;
	}

	onRemove(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		unbroadcast(this, lumo.PAN_START);
		unbroadcast(this, lumo.PAN);
		unbroadcast(this, lumo.PAN_END);
		unbroadcast(this, lumo.ZOOM_START);
		unbroadcast(this, lumo.ZOOM);
		unbroadcast(this, lumo.ZOOM_END);
		this.layers.forEach(layer => {
			layer.onRemove(plot);
		});
		this.plot = null;
		return this;
	}

	add(id, layer) {
		if (!layer) {
			throw 'No layer argument provided';
		}
		if (this.layers.indexOf(layer) !== -1) {
			throw 'Provided layer is already attached to the swap';
		}
		this.layers.push(layer);
		if (this.plot) {
			layer.onAdd(this.plot);
		}
		return this;
	}

	remove(id, layer) {
		if (!layer) {
			throw 'No layer argument provided';
		}
		const index = this.layers.indexOf(layer);
		if (index === -1) {
			throw 'Provided layer is not attached to the swap';
		}
		this.layers.splice(index, 1);
		if (this.plot) {
			layer.onRemove(this.plot);
		}
		return this;
	}

	setSwapFunc(func) {
		if (this.swapFunc) {
			this.swap.removeListener('load', this.swapFunc);
			this.swap.removeListener('zoomend', this.swapFunc);
			this.swap.removeListener('panend', this.swapFunc);
		}
		this.swapFunc = func;
		this.swap.on('load', func);
		this.swap.on('zoomend', func);
		this.swap.on('panend', func);
	}

	has(layer) {
		const index = this.layers.indexOf(layer);
		return index !== -1;
	}

	show() {
		this.hidden = false;
		this.layers.forEach(layer => {
			layer.show();
		});
		return this;
	}

	hide() {
		this.hidden = true;
		this.layers.forEach(layer => {
			layer.hide();
		});
		return this;
	}

	isHidden() {
		return this.hidden;
	}

	mute() {
		this.muted = true;
		return this;
	}

	unmute() {
		if (this.muted) {
			this.muted = false;
			if (this.plot) {
				// get visible coords
				const coords = this.plot.getTargetVisibleCoords();
				// request tiles
				this.requestTiles(coords);
			}
		}
		return this;
	}

	isMuted() {
		return this.muted;
	}

	enable() {
		this.show();
		this.unmute();
		return this;
	}

	disable() {
		this.hide();
		this.mute();
		return this;
	}

	isDisabled() {
		return this.muted && this.hidden;
	}

	setZIndex(index) {
		this.zIndex = index;
		this.layers.forEach(layer => {
			layer.setZIndex(index);
		});
	}

	setOpacity(opacity) {
		this.opacity = Math.max(0, Math.min(opacity, 1.0)); //[0,1];
		this.layers.forEach(layer => {
			layer.setOpacity(opacity);
		});
	}

	isFiltered() {
		return reduce(this.layers, (result, layer) => {
			return result || layer.isFiltered();
		}, false);
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

	draw(timestamp) {
		if (this.hidden) {
			this.layers.forEach(layer => {
				if (layer.renderer && layer.renderer.clear) {
					// clear DOM based renderer
					layer.renderer.clear();
				}
			});
			return this;
		}
		this.layers.forEach(layer => {
			layer.draw(timestamp);
		});
		return this;
	}

	refresh() {
		this.layers.forEach(layer => {
			layer.refresh();
		});
	}

	requestTiles(coords) {
		if (this.muted) {
			return this;
		}
		this.layers.forEach(layer => {
			layer.requestTiles(coords);
		});
	}
}

module.exports = Swap;
