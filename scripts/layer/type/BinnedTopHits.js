'use strict';

const defaultTo = require('lodash/defaultTo');
const Bivariate = require('./Bivariate');

class BinnedTopHits extends Bivariate {

	constructor(options = {}) {
		super(options);
		this.sortField = defaultTo(options.sortField, null);
		this.sortOrder = defaultTo(options.sortOrder, 'desc');
		this.hitsCount = defaultTo(options.hitsCount, 10);
		this.includeFields = defaultTo(options.includeFields, null);
	}

	setRequestor(requestor, xyz = false) {
		this.requestTile = requestor.requestJSON(xyz);
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
