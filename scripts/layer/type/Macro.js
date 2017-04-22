'use strict';

const defaultTo = require('lodash/defaultTo');
const Bivariate = require('./Bivariate');

class Macro extends Bivariate {

	constructor(options = {}) {
		super(options);
		this.lod = defaultTo(options.lod, 4);
		this.transform = data => {
			if (this.lod > 0) {
				const view = new DataView(data);
				const pointsByteLength = view.getUint32(0, true /* little endian */);
				const offsetsByteLength = view.getUint32(4, true  /* little endian */);
				const points = data.slice(8, 8+pointsByteLength);
				const offsets = data.slice(8+pointsByteLength, 8+pointsByteLength+offsetsByteLength);
				return {
					points: new Float32Array(points),
					offsets: new Uint32Array(offsets)
				};
			}
			return new Float32Array(data);
		};
	}

	setLOD(lod) {
		this.lod = lod;
	}

	getTile(name = 'macro') {
		const params = {
			xField: this.xField,
			yField: this.yField,
			left: this.left,
			right: this.right,
			bottom: this.bottom,
			top: this.top,
			resolution: this.resolution,
			lod: this.lod
		};
		const tile = {};
		tile[name] = params;
		return tile;
	}
}

module.exports = Macro;
