'use strict';

const Bivariate = require('./Bivariate');

class Count extends Bivariate {

	constructor(meta, options = {}) {
		super(meta, options);
	}

	getTile(name = 'count') {
		const params = {
			xField: this.xField,
			yField: this.yField,
			left: this.left,
			right: this.right,
			bottom: this.bottom,
			top: this.top
		};
		const tile = {};
		tile[name] = params;
		return tile;
	}
}

module.exports = Count;
