'use strict';

const defaultTo = require('lodash/defaultTo');
const Bivariate = require('./Bivariate');

class Micro extends Bivariate {

	constructor(meta, options = {}) {
		super(meta, options);
		this.sortField = options.sortField;
		this.sortOrder = defaultTo(options.sortOrder, 'desc');
		this.hitsCount = defaultTo(options.hitsCount, 10);
		this.includeFields = defaultTo(options.includeFields, null);
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
		const params = {
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
			includeFields: this.includeFields,
		};
		const tile = {};
		tile[name] = params;
		return tile;
	}
}

module.exports = Micro;
