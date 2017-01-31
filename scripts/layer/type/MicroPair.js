'use strict';

const isString = require('lodash/isString');
const Micro = require('./Micro');

class MicroPair extends Micro {

	constructor(meta, options = {}) {
		super(meta, options);
		this.x2Field = options.x2Field;
		this.y2Field = options.y2Field;
	}

	setX2(field) {
		if (!isString(field)) {
			throw `field argument ${field} must be of type String`;
		}
		this.x2Field = field;
	}

	setY2(field) {
		if (!isString(field)) {
			throw `field argument ${field} must be of type String`;
		}
		this.y2Field = field;
	}

	getTile(name = 'micro-pair') {
		const params = {
			xField: this.xField,
			yField: this.yField,
			x2Field: this.x2Field,
			y2Field: this.y2Field,
			left: this.left,
			right: this.right,
			bottom: this.bottom,
			top: this.top,
			lod: this.lod,
			resolution: this.resolution,
			sortField: this.sortField,
			sortOrder: this.sortOrder,
			hitsCount: this.hitsCount,
			includeFields: this.includeFields
		};
		const tile = {};
		tile[name] = params;
		return tile;
	}
}

module.exports = MicroPair;
