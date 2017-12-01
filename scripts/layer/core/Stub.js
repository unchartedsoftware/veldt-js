'use strict';

const lumo = require('lumo');

/**
 * Simple stub layer that allows the creation of a lumo.TileLayer with no data, or data provided by an extended class.
 */
class Stub extends lumo.TileLayer {

	/**
	 * Instantiates a stub layer.
	 *
	 * @param {Object} options - The options parameter.
	 */
	constructor(options) {
		super(options);
	}

	/**
	 * Stub for requesting tile data.  Allows extended class to provide its own data (if applicable).
	 *
	 * @param {TileCoord} coord - The tile coord.
	 * @param {Function} done - The callback function.
	 */
	requestTile(coord, done) {
		done(null, {});
	}
}

module.exports = Stub;
