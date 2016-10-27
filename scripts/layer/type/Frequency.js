'use strict';

const _ = require('lodash');
const Live = require('../core/Live');
const Elastic = require('../param/Elastic');
const Tiling = require('../param/Tiling');
const DateHistogram = require('../agg/DateHistogram');
const mixin = require('../../util/mixin');

class Frequency extends mixin(Live).with(Elastic, Tiling, DateHistogram) {

	constructor(meta, options = {}) {
		super(meta, options);
		this.type = 'frequency';
	}

	extractExtrema(data) {
		return {
			min: _.min(data),
			max: _.max(data)
		};
	}
}

module.exports = Frequency;
