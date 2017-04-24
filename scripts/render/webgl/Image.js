'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');

class Image extends lumo.TextureRenderer {
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

	addTile(array, tile) {
		array.set(tile.coord.hash, new Uint8Array(tile.data));
	}
}

module.exports = Image;
