'use strict';

const Requestor = require('./Requestor');

class MetaRequestor extends Requestor {
	constructor(pipeline, callback) {
		super(`ws/meta/${pipeline}`, callback);
		this.pipeline = pipeline;
	}
	getURL() {
		return `meta/${this.pipeline}`;
	}
}

module.exports = MetaRequestor;
