'use strict';

const Live = require('../core/Live');
const Elastic = require('../param/Elastic');
const Binning = require('../param/Binning');
const TopHits = require('../agg/TopHits');
const mixin = require('../../util/mixin');

class Preview extends mixin(Live).with(Elastic, Binning, TopHits) {

	constructor(meta, options = {}) {
		super(meta, options);
		this.type = 'preview';
	}
}

module.exports = Preview;
