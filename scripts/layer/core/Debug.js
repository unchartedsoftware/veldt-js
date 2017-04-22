'use strict';

const lumo = require('lumo');

class Debug extends lumo.TileLayer {

	constructor(options) {
		super(options);
	}

	requestTile(coord, done) {
		done(null, {});
	}
}

module.exports = Debug;
