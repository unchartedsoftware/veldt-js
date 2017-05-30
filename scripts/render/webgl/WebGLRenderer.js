'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');

class WebGLRenderer extends lumo.WebGLTileRenderer {

	constructor(options = {}) {
		super(options);
		this.brightness = defaultTo(options.brightness, 1.0);
	}

	brightness(brightness) {
		this.brightness = brightness;
		if (this.plot) {
			this.layer.plot.setDirty();
		}
	}
}

module.exports = WebGLRenderer;
