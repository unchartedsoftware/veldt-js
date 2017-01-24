'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');

class Group {

	constructor(options = {}) {
		this.hidden = defaultTo(options.hidden, false);
		this.muted = defaultTo(options.muted, false);
		this.layers = defaultTo(options.layers, []);
	}

	onAdd(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
		this.plot = plot;
		// for each layer
		this.layers.forEach(layer => {
			layer.plot = plot;
			if (layer.renderer) {
				layer.renderer.onAdd(layer);
			}
		});
		// refresh tiles
		this.refresh();
		this.layers.forEach(layer => {
			// emit on add
			layer.emit(lumo.ON_ADD, new lumo.LayerEvent(layer));
		});
		return this;
	}

	onRemove(plot) {
		if (!plot) {
			throw 'No plot argument provided';
		}
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
			layer.refresh();
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
