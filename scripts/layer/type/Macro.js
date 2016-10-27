'use strict';

const _ = require('lodash');
const Live = require('../core/Live');
const Elastic = require('../param/Elastic');
const Binning = require('../param/Binning');
const mixin = require('../../util/mixin');

class Macro extends mixin(Live).with(Elastic, Binning) {

	constructor(meta, options = {}) {
		super(meta, options);
		this.type = 'macro';
	}

	extractExtrema(data) {
		const bins = new Float64Array(data);
		return {
			min: _.min(bins),
			max: _.max(bins)
		};
	}
}

module.exports = Macro;
