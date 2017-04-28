'use strict';

const defaultTo = require('lodash/defaultTo');
const Edge = require('./Edge');

class MacroEdge extends Edge {

	constructor(options = {}) {
		super(options);
		this.lod = defaultTo(options.lod, 4);
		this.sortField = defaultTo(options.sortField, null);
		this.sortOrder = defaultTo(options.sortOrder, 'desc');
		this.hitsCount = defaultTo(options.hitsCount, 10);
		this.transform = data => {
			if (this.lod > 0) {
				const view = new DataView(data);
				const edgesByteLength = view.getUint32(0, true /* little endian */);
				const offsetsByteLength = view.getUint32(4, true  /* little endian */);
				const numPoints = edgesByteLength / 4;
				const numOffsets = offsetsByteLength / 4;
				const points = new Float32Array(data, 8, numPoints);
				const offsets = new Uint32Array(data, 8 + edgesByteLength, numOffsets);
				return {
					points: points,
					offsets: offsets
				};
			}
			return new Float32Array(data);
		};
	}

	setRequestor(requestor) {
		this.requestTile = requestor.requestArrayBuffer();
	}

	extractExtrema(data) {
		let min = Infinity;
		let max = -Infinity;
		for (let i=0; i<data.length; i+=3) {
			const weight = data[i];
			if (weight < min) {
				min = weight;
			}
			if (weight > max) {
				max = weight;
			}
		}
		return {
			min: min,
			max: max
		};
	}

	setLOD(lod) {
		this.lod = lod;
	}

	setSortField(sortField) {
		this.sortField = sortField;
	}

	setSortOrder(sortOrder) {
		this.sortOrder = sortOrder;
	}

	setHitsCount(hitsCount) {
		this.hitsCount = hitsCount;
	}

	getTile(name = 'macro-edge') {
		return {
			[name]: {
				srcXField: this.srcXField,
				srcYField: this.srcYField,
				dstXField: this.dstXField,
				dstYField: this.dstYField,
				requireSrc: this.requireSrc,
				requireDst: this.requireDst,
				weightField: this.weightField,
				left: this.left,
				right: this.right,
				bottom: this.bottom,
				top: this.top,
				lod: this.lod,
				sortField: this.sortField,
				sortOrder: this.sortOrder,
				hitsCount: this.hitsCount
			}
		};
	}
}

module.exports = MacroEdge;
