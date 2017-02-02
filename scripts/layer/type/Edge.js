'use strict';

const defaultTo = require('lodash/defaultTo');
const isString = require('lodash/isString');
const isNumber = require('lodash/isNumber');
const Live = require('../core/Live');

class Edge extends Live {

	constructor(meta, options = {}) {
		super(meta, options);
		this.srcXField = defaultTo(options.srcXField, 'srcXField');
		this.srcYField = defaultTo(options.srcYField, 'srcYField');
		this.dstXField = defaultTo(options.dstXField, 'dstXField');
		this.dstYField = defaultTo(options.dstYField, 'dstYField');

		// Bounds TODO: Common with Bivariate.. is there a sensiblle default?
		this.left = defaultTo(options.left, -180);
		this.right = defaultTo(options.right, 180);
		this.bottom = defaultTo(options.bottom, -90);
		this.top = defaultTo(options.top, 90);
		this.setBounds(options.left, options.right, options.bottom, options.top);

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

	// TODO: Common with Micro
	setLOD(lod) {
		this.lod = lod;
	}

	setSortField(sortField) {
		this.sortField = sortField;
	}

	setSortOrder(sortOrder) {
		this.sortOrder = sortOrder;
	}

	setHitsCount(hitsCount) {
		this.hitsCount = hitsCount;
	}

	setIncludeFields(includeFields) {
		this.includeFields = includeFields;
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
