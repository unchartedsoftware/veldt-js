'use strict';

const Live = require('../core/Live');
const Elastic = require('../param/Elastic');
const Tiling = require('../param/Tiling');
const mixin = require('../../util/mixin');

class Count extends mixin(Live).with(Elastic, Tiling) {

	constructor(meta, options = {}) {
		super(meta, options);
		this.type = 'count';
	}
}

module.exports = Count;
