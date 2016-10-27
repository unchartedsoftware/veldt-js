'use strict';

const _ = require('lodash');
const Live = require('../core/Live');
const Elastic = require('../param/Elastic');
const Tiling = require('../param/Tiling');
const TermsFilter = require('../agg/TermsFilter');
const DateHistogram = require('../agg/DateHistogram');
const Histogram = require('../agg/Histogram');
const mixin = require('../../util/mixin');

class TopicFrequency extends mixin(Live).with(Elastic, Tiling, TermsFilter, DateHistogram, Histogram) {

	constructor(meta, options = {}) {
		super(meta, options);
		this.type = 'topic_frequency';
	}

	extractExtrema(data) {
		return {
			min: _.min(data),
			max: _.max(data)
		};
	}
}

module.exports = TopicFrequency;
