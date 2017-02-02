'use strict';

const defaultTo = require('lodash/defaultTo');
const isString = require('lodash/isString');
const isNumber = require('lodash/isNumber');
const Live = require('../core/Live');

class Edge extends Live {

	constructor(meta, options = {}) {
		super(meta, options);
		super(meta, options);
		this.srcXField = options.srcXField;
		this.srcYField = options.srcYField;
		this.dstXField = options.dstXField;
		this.dstYField = options.dstYField;

		// Bounds TODO: Common with Bivariate
		this.left = options.left;
		this.right = options.right;
		this.bottom = options.bottom;
		this.top = options.top;

		// TODO: Common with Micro
		this.lod = defaultTo(options.lod, 4);
		this.sortField = defaultTo(options.sortField, null);
		this.sortOrder = defaultTo(options.sortOrder, 'desc');
		this.hitsCount = defaultTo(options.hitsCount, 10);
		this.includeFields = defaultTo(options.includeFields, null);
		this.transform = data => {
			if (this.lod > 0) {
				return {
					points: new Float32Array(data.points),
					offsets: data.offsets,
					hits: data.hits
				};
			}
			return {
				points: new Float32Array(data.points),
				hits: data.hits
			};
		};
	}

	setBounds(left, right, bottom, top) {
		if (!isNumber(left)) {
			throw `left (1st) argument ${left} is invalid`;
		}
		if (!isNumber(right)) {
			throw `right (2nd) argument ${right} is invalid`;
		}
		if (!isNumber(bottom)) {
			throw `bottom (3rd) argument ${bottom} is invalid`;
		}
		if (!isNumber(top)) {
			throw `top (4th) argument ${top} is invalid`;
		}
	}

	setSrcXField(field) {
		this._setWithStringCheck('srcXField', field);
	}

	setSrcYField(field) {
		this._setWithStringCheck('srcYField', field);
	}

	setDstXField(field) {
		this._setWithStringCheck('dstXField', field);
	}

	setDstYField(field) {
		this._setWithStringCheck('dstYField', field);
	}

	// TODO: Pull-Up
	_setWithStringCheck(propertyName, stringValue) {
		if (!isString(stringValue)) {
			throw `${propertyName}'s value of ${stringValue} must be of type String`;
		}
		this[propertyName] = stringValue;
	}

	getTile(name = 'edge') {
		const params = {
			srcXField: this.srcXField,
			srcYField: this.srcYField,
			dstXField: this.dstXField,
			dstYField: this.dstYField,

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

module.exports = Edge;
