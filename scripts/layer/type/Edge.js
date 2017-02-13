'use strict';

const defaultTo = require('lodash/defaultTo');
const isString = require('lodash/isString');
const isNumber = require('lodash/isNumber');
const Live = require('../core/Live');

const setStringField = function(layer, property, value) {
	if (!isString(value)) {
		throw `${property} argument ${value} must be of type String`;
	}
	layer[property] = value;
};

class Edge extends Live {

	constructor(meta, options = {}) {
		super(meta, options);
		this.srcXField = defaultTo(options.srcXField, 'srcXField');
		this.srcYField = defaultTo(options.srcYField, 'srcYField');
		this.dstXField = defaultTo(options.dstXField, 'dstXField');
		this.dstYField = defaultTo(options.dstYField, 'dstYField');
		const left = defaultTo(options.left, 0);
		const right = defaultTo(options.right, Math.pow(2, 32));
		const bottom = defaultTo(options.bottom, 0);
		const top = defaultTo(options.top, Math.pow(2, 32));
		this.setBounds(left, right, bottom, top);
	}

	setSrcXField(field) {
		setStringField(this, 'srcXField', field);
	}

	setSrcYField(field) {
		setStringField(this, 'srcYField', field);
	}

	setDstXField(field) {
		setStringField(this, 'dstXField', field);
	}

	setDstYField(field) {
		setStringField(this, 'dstYField', field);
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

}

module.exports = Edge;
