'use strict';

const lumo = require('lumo');

class Image extends lumo.TextureRenderer {
	addTile(array, tile) {
		array.set(tile.coord.hash, new Uint8Array(tile.data));
	}
}

module.exports = Image;
