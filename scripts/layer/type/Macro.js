'use strict';

const defaultTo = require('lodash/defaultTo');
const Bivariate = require('./Bivariate');
const Request = require('../request/Request');

class Macro extends Bivariate {

	constructor(options = {}) {
		super(options);
		this.lod = defaultTo(options.lod, 4);
		this.transform = data => {
			if (this.lod > 0) {
				const view = new DataView(data);
				const pointsByteLength = view.getUint32(0, true /* little endian */);
				const offsetsByteLength = view.getUint32(4, true  /* little endian */);
				const numPoints = pointsByteLength / 4;
				const numOffsets = offsetsByteLength / 4;
				const points = new Float32Array(data, 8, numPoints);
				const offsets = new Uint32Array(data, 8 + pointsByteLength, numOffsets);
				return {
					points: points,
					offsets: offsets
				};
			}
			return new Float32Array(data);
		};
	}

	setRequestor(requestor) {
		this.requestTile = Request.requestArrayBuffer(requestor);
	}

	setLOD(lod) {
		this.lod = lod;
	}

	getTile(name = 'macro') {
		return {
			[name]: {
				xField: this.xField,
				yField: this.yField,
				left: this.left,
				right: this.right,
				bottom: this.bottom,
				top: this.top,
				resolution: this.resolution,
				lod: this.lod
			}
		};
	}
}

module.exports = Macro;
