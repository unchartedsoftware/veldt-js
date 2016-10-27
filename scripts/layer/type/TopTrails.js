'use strict';

const Live = require('../core/Live');
const Elastic = require('../param/Elastic');
const Binning = require('../param/Binning');
const Terms = require('../agg/Terms');
const mixin = require('../../util/mixin');

class TopTrails extends mixin(Live).with(Elastic, Binning, Terms) {

	constructor(meta, options = {}) {
		super(meta, options);
		this.type = 'top_trails';
	}
}

module.exports = TopTrails;
