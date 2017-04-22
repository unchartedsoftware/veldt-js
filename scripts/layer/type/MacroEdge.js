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
				const edges = data.slice(8, 8+edgesByteLength);
				const offsets = data.slice(8+edgesByteLength, 8+edgesByteLength+offsetsByteLength);
				return {
					edges: new Float32Array(edges),
					offsets: new Uint32Array(offsets)
				};
			}
			return new Float32Array(data);
		};
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
		const params = {
			srcXField: this.srcXField,
			srcYField: this.srcYField,
			dstXField: this.dstXField,
			dstYField: this.dstYField,
			weightField: this.weightField,
			left: this.left,
			right: this.right,
			bottom: this.bottom,
			top: this.top,
			lod: this.lod,
			sortField: this.sortField,
			sortOrder: this.sortOrder,
			hitsCount: this.hitsCount
		};
		const tile = {};
		tile[name] = params;
		return tile;
	}
}

module.exports = MacroEdge;
