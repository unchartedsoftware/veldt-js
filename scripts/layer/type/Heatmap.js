'use strict';

const _ = require('lodash');
const Bivariate = require('./Bivariate');

class Heatmap extends Bivariate {

	constructor(meta, options = {}) {
		super(meta, options);
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
