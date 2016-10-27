'use strict';

const _ = require('lodash');
const Live = require('../core/Live');
const Elastic = require('../param/Elastic');
const Binning = require('../param/Binning');
const Metric = require('../agg/Metric');
const mixin = require('../../util/mixin');

class Heatmap extends mixin(Live).with(Elastic, Binning, Metric) {

	constructor(meta, options = {}) {
		super(meta, options);
		this.type = 'heatmap';
	}

	extractExtrema(data) {
		const bins = new Float64Array(data);
		return {
			min: _.min(bins),
			max: _.max(bins)
		};
	}
}

module.exports = Heatmap;
