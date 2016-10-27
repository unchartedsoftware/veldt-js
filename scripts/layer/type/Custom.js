'use strict';

const Live = require('../core/Live');
const Elastic = require('../param/Elastic');
const Tiling = require('../param/Tiling');
const CustomAggs = require('../agg/CustomAggs');
const mixin = require('../../util/mixin');

class Custom extends mixin(Live).with(Elastic, Tiling, CustomAggs) {

	constructor(meta, options = {}) {
		super(meta, options);
		this.type = 'custom';
	}
}

module.exports = Custom;
