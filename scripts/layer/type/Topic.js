'use strict';

const _ = require('lodash')
const values = require('lodash/values');
const defaultTo = require('lodash/defaultTo');
const Bivariate = require('./Bivariate');

class Topic extends Bivariate {

	constructor(meta, options = {}) {
		super(meta, options);
		this.include = [];
		this.exclude = [];
		this.exclusiveness = 0;
		this.topicClusterCount = 3;
		this.topicWordCount = 3;
		this.updatedParameters = false;
		this.timeFrom = 0;
		this.timeTo = 0;
	}

	extractExtrema(data) {
		const valsRaw = values(data);
		const vals = _.flatMap(valsRaw, (value, key) => {
            return _.map(value.words, (weight, word) => {
    			return weight;
    		});
        });

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

	arraysEqual(array1, array2) {
		if(array1.length !== array2.length) {
			return false;
		}

		for(var i = array1.length; i--;) {
			if(array1[i] !== array2[i]) {
				return false;
			}
		}

		return true;
	}

	hasUpdatedParameters() {
		return this.updatedParameters;
	}

	resetParameters() {
		this.updatedParameters = false;
	}

	setExclusiveness(exclusiveness) {
		if (this.exclusiveness !== exclusiveness) {
			this.updatedParameters = true;
			this.exclusiveness = exclusiveness;
		}
	}

	setTimeFrom(timeFrom) {
		if (this.timeFrom !== timeFrom) {
			this.updatedParameters = true;
			this.timeFrom = timeFrom;
		}
	}

	setTimeTo(timeTo) {
		if (this.timeTo !== timeTo) {
			this.updatedParameters = true;
			this.timeTo = timeTo;
		}
	}

	setTopicWordCount(topicWordCount) {
		if (this.topicWordCount !== topicWordCount) {
			this.updatedParameters = true;
			this.topicWordCount = topicWordCount;
		}
	}

	setTopicClusterCount(topicClusterCount) {
		if (this.topicClusterCount !== topicClusterCount) {
			this.topicClusterCount = true;
			this.topicClusterCount = topicClusterCount;
		}
	}

	setInclude(includeTerms) {
		if (!this.arraysEqual(includeTerms, this.include)) {
			this.updatedParameters = true;
			this.include = includeTerms;
		}
	}

	setExclude(excludeTerms) {
		if (!this.arraysEqual(excludeTerms, this.exclude)) {
			this.updatedParameters = true;
			this.exclude = excludeTerms;
		}
	}

	getTile(name = 'topic') {
		const params = {
			xField: this.xField,
			yField: this.yField,
			left: this.left,
			right: this.right,
			bottom: this.bottom,
			top: this.top,
			include: this.include,
			exclude: this.exclude,
			exclusiveness: this.exclusiveness,
			topicWordCount: this.topicWordCount,
			topicClusterCount: this.topicClusterCount,
			timeFrom: this.timeFrom,
			timeTo: this.timeTo
		};
		const tile = {};
		tile[name] = params;
		return tile;
	}
}

module.exports = Topic;
