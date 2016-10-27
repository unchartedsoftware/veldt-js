'use strict';

const Live = require('../core/Live');
const Elastic = require('../param/Elastic');
const Tiling = require('../param/Tiling');
const TopHits = require('../agg/TopHits');
const mixin = require('../../util/mixin');

class Micro extends mixin(Live).with(Elastic, Tiling, TopHits) {

	constructor(meta, options = {}) {
		super(meta, options);
		this.type = 'micro';
	}
}

module.exports = Micro;
