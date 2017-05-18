'use strict';

const lumo = require('lumo');

/**
 * Simple debug layer for displayed tile coordnates.
 */
class Debug extends lumo.TileLayer {

	/**
	 * Instantiates a debug layer.
	 *
	 * @param {Object} options - The options parameter.
	 */
	constructor(options) {
		super(options);
	}

	/**
	 * Stub for requesting tile data.
	 *
	 * @param {TileCoord} coord - The tile coord.
	 * @param {Function} done - The callback function.
	 */
	requestTile(coord, done) {
		done(null, {});
	}
}

module.exports = Debug;
