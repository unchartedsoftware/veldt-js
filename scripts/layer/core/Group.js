'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');

class Group {

	constructor(options = {}) {
		this.hidden = defaultTo(options.hidden, false);
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
			layer.renderers.forEach(renderer => {
				renderer.onAdd(layer);
			});
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

	draw(timestamp) {
		if (this.hidden) {
			return;
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
		this.layers.forEach(layer => {
			layer.requestTiles(coords);
		});
	}
}

module.exports = Group;
