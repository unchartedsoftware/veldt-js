'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');

class TextureRenderer extends lumo.WebGLTextureRenderer {

	constructor(options = {}) {
		super(options);
		this.brightness = defaultTo(options.brightness, 1.0);
	}
}

module.exports = TextureRenderer;
