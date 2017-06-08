'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');

const ZOOM_START = Symbol();

class WebGLRenderer extends lumo.WebGLTileRenderer {

	constructor(options = {}) {
		super(options);
		this.brightness = defaultTo(options.brightness, 1.0);
		this[ZOOM_START] = null;
	}

	onAdd(layer) {
		super.onAdd(layer);
		this[ZOOM_START] = () => {
			this.layer.clear();
		};
		this.layer.plot.on(lumo.ZOOM_START, this[ZOOM_START]);
		return this;
	}

	onRemove(layer) {
		this.layer.plot.removeListener(lumo.ZOOM_START, this[ZOOM_START]);
		this[ZOOM_START] = null;
		super.onRemove(layer);
		return this;
	}

	setBrightness(brightness) {
		this.brightness = brightness;
		if (this.plot) {
			this.layer.plot.setDirty();
		}
	}
}

module.exports = WebGLRenderer;
