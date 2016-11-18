'use strict';

const min = require('lodash/min');
const max = require('lodash/max');
const Bivariate = require('./Bivariate');

class Heatmap extends Bivariate {

	constructor(meta, options = {}) {
		super(meta, options);
	}

	extractExtrema(data) {
		const bins = new Float64Array(data);
		return {
			min: min(bins),
			max: max(bins)
		};
	}

	getTile(name = 'heatmap') {
		const params = {
			xField: this.xField,
			yField: this.yField,
			left: this.left,
			right: this.right,
			bottom: this.bottom,
			top: this.top,
			resolution: this.resolution
		};
		const tile = {};
		tile[name] = params;
		return tile;
	}
}

module.exports = Heatmap;
