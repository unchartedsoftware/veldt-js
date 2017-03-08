'use strict';

const Heatmap = require('./Heatmap');

class Exclusiveness extends Heatmap {

	constructor(meta, options = {}) {
		super(meta, options);
		this.timeFrom = 0;
		this.timeTo = 0;
	}

	hasUpdatedParameters() {
		return this.updatedParameters;
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

	getTile(name = 'exclusiveness') {
		const params = {
            xField: this.xField,
			yField: this.yField,
			left: this.left,
			right: this.right,
			bottom: this.bottom,
			top: this.top,
			resolution: this.resolution,
			timeFrom: this.timeFrom,
			timeTo: this.timeTo
		};
		const tile = {};
		tile[name] = params;
		return tile;
	}
}

module.exports = Exclusiveness;
