'use strict';

const defaultTo = require('lodash/defaultTo');
const Bivariate = require('./Bivariate');

class Micro extends Bivariate {

	constructor(options = {}) {
		super(options);
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

	getTile(name = 'micro') {
		return {
			[name]: {
				xField: this.xField,
				yField: this.yField,
				left: this.left,
				right: this.right,
				bottom: this.bottom,
				top: this.top,
				lod: this.lod,
				sortField: this.sortField,
				sortOrder: this.sortOrder,
				hitsCount: this.hitsCount,
				includeFields: this.includeFields,
			}
		};
	}
}

module.exports = Micro;
