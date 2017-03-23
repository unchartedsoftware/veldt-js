'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');

class InteractiveRenderer extends lumo.WebGLInteractiveRenderer {

	constructor(options = {}) {
		super(options);
		this.brightness = defaultTo(options.brightness, 1.0);
	}
}

module.exports = InteractiveRenderer;
