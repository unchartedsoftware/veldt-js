'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');
const ImageRenderer = require('../../render/webgl/Image');

class Rest extends lumo.Layer {

	constructor(endpoint, options = {}) {
		super(options);
		this.ext = defaultTo(options.ext, 'png');
		this.scheme = defaultTo(options.ext, 'http');
		this.endpoint = endpoint;
		this.addRenderer(new ImageRenderer());
	}

	setExt(ext) {
		this.ext = ext;
	}

	setScheme(scheme) {
		this.scheme = scheme;
	}

	setSubDomains(subdomains) {
		this.subdomains = subdomains;
	}

	setEndpoint(endpoint) {
		this.endpoint = endpoint;
	}

	getTile(name = 'rest') {
		const params = {
			ext: this.ext,
			endpoint: this.endpoint,
			scheme: this.scheme
		};
		const tile = {};
		tile[name] = params;
		return tile;
	}
}

module.exports = Rest;
