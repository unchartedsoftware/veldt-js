'use strict';

const values = require('lodash/values');
const defaultTo = require('lodash/defaultTo');
const Bivariate = require('./Bivariate');

class TopTermCount extends Bivariate {

	constructor(options = {}) {
		super(options);
		this.termsField = options.termsField;
		this.termsCount = defaultTo(options.termsCount, 10);
	}

	extractExtrema(data) {
		const vals = values(data);
		let min = Infinity;
		let max = -Infinity;
		for (let i=0; i<vals.length; i++) {
			const val = vals[i];
			if (val > max) {
				max = val;
			}
			if (val < min) {
				min = val;
			}
		}
		return {
			min: min,
			max: max
		};
	}

	setTermsField(field) {
		this.termsField = field;
	}

	setTermsCount(count) {
		this.termsCount = count;
	}

	getTile(name = 'top-term-count') {
		const params = {
			xField: this.xField,
			yField: this.yField,
			left: this.left,
			right: this.right,
			bottom: this.bottom,
			top: this.top,
			termsField: this.termsField,
			termsCount: this.termsCount
		};
		const tile = {};
		tile[name] = params;
		return tile;
	}
}

module.exports = TopTermCount;
