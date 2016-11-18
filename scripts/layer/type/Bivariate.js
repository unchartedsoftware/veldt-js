'use strict';

const isString = require('lodash/isString');
const isNil = require('lodash/isNil');
const isNumber = require('lodash/isNumber');
const Live = require('../core/Live');

function isPoT(n) {
	return n && (n & (n - 1)) === 0;
}

class Bivariate extends Live {

	constructor(meta, options = {}) {
		super(meta, options);
		this.xField = options.xField;
		this.yField = options.yField;
		this.left = options.left;
		this.right = options.right;
		this.bottom = options.bottom;
		this.top = options.top;
		this.resolution = options.resolution;
	}

	setX(field, left, right) {
		if (!isString(field)) {
			throw `field argument ${field} must be of type String`;
		}
		if (!isNil(left)) {
			throw `left argument ${left} is invalid`;
		}
		if (!isNil(left)) {
			throw `right argument ${right} is invalid`;
		}
		this.xField = field;
		this.left = left;
		this.right = right;
	}

	setY(field, bottom, top) {
		if (!isString(field)) {
			throw `field argument ${field} must be of type String`;
		}
		if (!isNil(bottom)) {
			throw `bottom argument ${bottom} is invalid`;
		}
		if (!isNil(top)) {
			throw `top argument ${top} is invalid`;
		}
		this.yField = field;
		this.bottom = bottom;
		this.top = top;
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
}

module.exports = Bivariate;
