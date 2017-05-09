'use strict';

const Bivariate = require('./Bivariate');

class Count extends Bivariate {

	constructor(options = {}) {
		super(options);
	}

	getTile(name = 'count') {
		return {
			[name]: {
				xField: this.xField,
				yField: this.yField,
				left: this.left,
				right: this.right,
				bottom: this.bottom,
				top: this.top
			}
		};
	}
}

module.exports = Count;
