'use strict';

const _ = require('lodash');
const Live = require('../core/Live');
const Elastic = require('../param/Elastic');
const Tiling = require('../param/Tiling');
const TopHitsAgg = require('../agg/TopHits');
const mixin = require('../../util/mixin');

class TopHits extends mixin(Live).with(Elastic, Tiling, TopHitsAgg) {

	constructor(meta, options = {}) {
		super(meta, options);
		this.type = 'micro';
	}

	extractExtrema(data) {
		const sortField = this._params.top_hits && this._params.top_hits.sort ? this._params.top_hits.sort : null;
		if (!sortField || !data || data.length === 0) {
			return {
				min: Infinity,
				max: -Infinity
			};
		}
		const min = _.minBy(data, datum => {
			return _.get(datum, sortField);
		});
		const max = _.maxBy(data, datum => {
			return _.get(datum, sortField);
		});
		return {
			min: _.get(min, sortField),
			max: _.get(max, sortField)
		};
	}
}

module.exports = TopHits;
