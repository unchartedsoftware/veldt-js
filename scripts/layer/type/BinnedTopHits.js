'use strict';

const defaultTo = require('lodash/defaultTo');
const Bivariate = require('./Bivariate');

class BinnedTopHits extends Bivariate {

	constructor(meta, options = {}) {
		super(meta, options);
		this.sortField = defaultTo(options.sortField, null);
		this.sortOrder = defaultTo(options.sortOrder, 'desc');
		this.hitsCount = defaultTo(options.hitsCount, 10);
		this.includeFields = defaultTo(options.includeFields, null);

		//this.lod = defaultTo(options.lod, 4);
		this.transform = data => {
			let points = [];
			const results = data.filter((value)=>{return value !== null;});
			for (let res of results) {
				for (let node of res) {
					points.push(node.node.location.x);
					points.push(node.node.location.y);
				}
			}
			return {
				points: new Float32Array(points),
				hits: results
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

	getTile(name = 'binned-top-hits') {
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

module.exports = BinnedTopHits;
