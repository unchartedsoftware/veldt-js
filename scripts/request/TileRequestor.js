'use strict';

const Requestor = require('./Requestor');

class TileRequestor extends Requestor {
	constructor(pipeline, callback) {
		super(`ws/tile/${pipeline}`, callback);
		this.pipeline = pipeline;
	}
	getURL() {
		return `tile/${this.pipeline}`;
	}
}

module.exports = TileRequestor;
