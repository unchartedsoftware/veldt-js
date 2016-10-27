'use strict';

const lumo = require('lumo');

class Debug extends lumo.Layer {

	constructor(options) {
		super(options);
	}

	requestTile(coord, done) {
		done(coord);
	}
}

module.exports = Debug;
