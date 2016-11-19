'use strict';

const Bivariate = require('./Bivariate');

class Macro extends Bivariate {

	constructor(meta, options = {}) {
		super(meta, options);
	}

	getTile(name = 'macro') {
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

module.exports = Macro;
