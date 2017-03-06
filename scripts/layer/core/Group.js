'use strict';

const lumo = require('lumo');
const EventEmitter = require('events');
const defaultTo = require('lodash/defaultTo');

const broadcast = function(group, type) {
	const handler = event => {
		group.layers.forEach(layer => {
			layer.emit(type, event);
		});
	};
	group.on(type, handler);
	group.broadcasts.set(type, handler);
};

const unbroadcast = function(group, type) {
	group.removeListener(type, event => {
		group.layers.forEach(layer => {
			layer.emit(type, event);
		});
	});
	group.broadcasts.delete(type);
};

class Group extends EventEmitter {

	constructor(options = {}) {
		super();
		this.hidden = defaultTo(options.hidden, false);
		this.muted = defaultTo(options.muted, false);
		this.layers = defaultTo(options.layers, []);
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
		broadcast(this, lumo.TILE_REQUEST);
		broadcast(this, lumo.TILE_FAILURE);
		broadcast(this, lumo.TILE_ADD);
		broadcast(this, lumo.TILE_DISCARD);
		broadcast(this, lumo.TILE_REMOVE);
		broadcast(this, lumo.LOAD);
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
		unbroadcast(this, lumo.TILE_REQUEST);
		unbroadcast(this, lumo.TILE_FAILURE);
		unbroadcast(this, lumo.TILE_ADD);
		unbroadcast(this, lumo.TILE_DISCARD);
		unbroadcast(this, lumo.TILE_REMOVE);
		unbroadcast(this, lumo.LOAD);
		this.layers.forEach(layer => {
			layer.onRemove(plot);
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
			layer.onAdd(this.plot);
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
			layer.onRemove(this.plot);
		}
		return this;
	}

	has(layer) {
		const index = this.layers.indexOf(layer);
		return index !== -1;
	}

	show() {
		this.hidden = false;
		return this;
	}

	hide() {
		this.hidden = true;
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
				const coords = this.plot.getVisibleCoords();
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

module.exports = Group;
