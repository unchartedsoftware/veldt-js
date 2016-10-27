'use strict';

const _ = require('lodash');
const Live = require('../core/Live');
const Elastic = require('../param/Elastic');
const Tiling = require('../param/Tiling');
const TopTerms = require('../agg/TopTerms');
const Histogram = require('../agg/Histogram');
const TopHits = require('../agg/TopHits');
const mixin = require('../../util/mixin');

class TopCount extends mixin(Live).with(Elastic, Tiling, TopTerms, Histogram, TopHits) {

	constructor(meta, options = {}) {
		super(meta, options);
		this.type = 'top_count';
	}

	extractExtrema(data) {
		return {
			min: _.min(data),
			max: _.max(data)
		};
	}
}

module.exports = TopCount;
