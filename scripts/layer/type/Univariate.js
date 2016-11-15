'use strict';

const isString = require('lodash/isString');
const isNil = require('lodash/isNil');
const isNumber = require('lodash/isNumber');
const Live = require('../core/Live');

function isPoT(n) {
	return n && (n & (n - 1)) === 0;
}

class Univariate extends Live {

	constructor(meta, options = {}) {
		super(meta, options);
		this.field = options.field;
		this.min = options.min;
		this.max = options.max;
		this.resolution = options.resolution;
	}

	setRange(field, min, max) {
		if (!isString(field)) {
			throw `field argument ${field} must be of type String`;
		}
		if (!isNil(min)) {
			throw `min argument ${min} is invalid`;
		}
		if (!isNil(max)) {
			throw `max argument ${max} is invalid`;
		}
		this.field = field;
		this.min = min;
		this.max = max;
	}

	setResolution(resolution) {
		if (!(isNumber(resolution))) {
			throw `resolution argument ${resolution} must be of type Number`;
		}
		if (!isPoT(resolution)) {
			throw `resolution argument ${resolution} must be a power-of-two`;
		}
		this.resolution = resolution;
	}

	getParams() {
		return {
			field: this.field,
			min: this.min,
			max: this.max,
			resolution: this.resolution
		};
	}
}

module.exports = Univariate;
