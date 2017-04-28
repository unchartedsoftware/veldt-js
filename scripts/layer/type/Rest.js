'use strict';

const _ = require('lodash');
const defaultTo = require('lodash/defaultTo');
const Base = require('../core/Base');
const ImageRenderer = require('../../render/webgl/Image');
const Request = require('../Request');

class Rest extends Base {

	constructor(options = {}) {
		super(options);
		this.ext = defaultTo(options.ext, 'png');
		this.scheme = defaultTo(options.scheme, 'http');
		this.endpoint = defaultTo(options.endpoint, 'endpoint');
		if (_.isNil(this.renderer)) {
			this.setRenderer(new ImageRenderer());
		}
	}

	setRequestor(requestor) {
		this.requestTile = Request.requestArrayBuffer(requestor);
	}

	setExt(ext) {
		this.ext = ext;
	}

	setScheme(scheme) {
		this.scheme = scheme;
	}

	setEndpoint(endpoint) {
		this.endpoint = endpoint;
	}

	getTile(name = 'rest') {
		return {
			[name]: {
				ext: this.ext,
				endpoint: this.endpoint,
				scheme: this.scheme
			}
		};
	}
}

module.exports = Rest;
