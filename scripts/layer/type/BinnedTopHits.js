'use strict';

const defaultTo = require('lodash/defaultTo');
const Bivariate = require('./Bivariate');

const isPowerOfTwo = function(n) {
	return n && (n & (n - 1)) === 0;
};

class BinnedTopHits extends Bivariate {

	constructor(options = {}) {
		super(options);
		this.lod = 0;
		this.sortField = defaultTo(options.sortField, null);
		this.sortOrder = defaultTo(options.sortOrder, 'desc');
		this.hitsCount = defaultTo(options.hitsCount, 1);
		this.includeFields = defaultTo(options.includeFields, null);
		this.resolution = defaultTo(options.resolution, 32);
		if(!isPowerOfTwo(this.resolution)) {
			this.resolution = 32;
		}
		this.transform = data => {
			return {
				points: new Float32Array(data.points),
				hits: data.hits.filter(value => value !== null)
			};
		};
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

	getTile(name = 'binned-top-hits') {
		return {
			[name]: {
				xField: this.xField,
				yField: this.yField,
				left: this.left,
				right: this.right,
				bottom: this.bottom,
				top: this.top,
				resolution: this.resolution,
				sortField: this.sortField,
				sortOrder: this.sortOrder,
				hitsCount: this.hitsCount,
				includeFields: this.includeFields
			}
		};
	}

}

module.exports = BinnedTopHits;
