'use strict';

const values = require('lodash/values');
const Bivariate = require('./Bivariate');

class TermsFrequencyCount extends Bivariate {

	constructor(options = {}) {
		super(options);
		this.termsField = options.termsField;
		this.fieldType =  options.fieldType;
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

	setFieldType(fieldType) {
		this.fieldType = fieldType;
	}

	getTile(name = 'terms-frequency-count') {
		return {
			[name]: {
				xField: this.xField,
				yField: this.yField,
				left: this.left,
				right: this.right,
				bottom: this.bottom,
				top: this.top,
				termsField: this.termsField,
				terms: this.terms,
				fieldType: this.fieldType
			}
		};
	}
}

module.exports = TermsFrequencyCount;
