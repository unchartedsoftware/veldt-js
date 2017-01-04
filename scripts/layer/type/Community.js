'use strict';

const minBy = require('lodash/minBy');
const maxBy = require('lodash/maxBy');
const Micro = require('./Micro');

class Community extends Micro {

	constructor(meta, options = {}) {
		super(meta, options);
		this.lod = 0;
	}

	extractExtrema(data) {
		const hits = data.hits;
		if (!hits || hits.length === 0) {
			// no hits
			return {
				min: Infinity,
				max: -Infinity
			};
		}
		const field = this.sortField;
		const min = minBy(hits, community => {
			return community[field];
		});
		const max = maxBy(hits, community => {
			return community[field];
		});
		return {
			min: min[field],
			max: max[field]
		};
	}
}

module.exports = Community;
