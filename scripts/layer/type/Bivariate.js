'use strict';

const defaultTo = require('lodash/defaultTo');
const isString = require('lodash/isString');
const isNumber = require('lodash/isNumber');
const Live = require('../core/Live');

function isPoT(n) {
	return n && (n & (n - 1)) === 0;
}

class Bivariate extends Live {

	constructor(meta, options = {}) {
		super(meta, options);
		this.xField = defaultTo(options.xField, 'x');
		this.yField = defaultTo(options.xField, 'y');
		const left = defaultTo(options.left, 0);
		const right = defaultTo(options.right, Math.pow(2, 32));
		const bottom = defaultTo(options.bottom, 0);
		const top = defaultTo(options.top, Math.pow(2, 32));
		this.setBounds(left, right, bottom, top);
		this.resolution = options.resolution;
	}

	setXField(field) {
		if (!isString(field)) {
			throw `xField argument ${field} must be of type String`;
		}
		this.xField = field;
	}

	setYField(field) {
		if (!isString(field)) {
			throw `yField argument ${field} must be of type String`;
		}
		this.yField = field;
	}

	setBounds(left, right, bottom, top) {
		if (!isNumber(left)) {
			throw `left argument ${left} is invalid`;
		}
		if (!isNumber(right)) {
			throw `right argument ${right} is invalid`;
		}
		if (!isNumber(bottom)) {
			throw `bottom argument ${bottom} is invalid`;
		}
		if (!isNumber(top)) {
			throw `top argument ${top} is invalid`;
		}
		this.left = left;
		this.right = right;
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
