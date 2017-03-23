'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');

class VertexRenderer extends lumo.WebGLVertexRenderer {

	constructor(options = {}) {
		super(options);
		this.brightness = defaultTo(options.brightness, 1.0);
	}
}

module.exports = VertexRenderer;
