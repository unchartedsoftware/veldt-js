'use strict';

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
		this.layers.forEach(layer => {
			layer.onAdd(plot);
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
		return index === -1;
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
}

module.exports = Group;
