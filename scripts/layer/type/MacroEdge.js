'use strict';

const defaultTo = require('lodash/defaultTo');
const Edge = require('./Edge');

class MacroEdge extends Edge {

	constructor(meta, options = {}) {
		super(meta, options);
		this.lod = defaultTo(options.lod, 4);
		this.sortField = defaultTo(options.sortField, null);
		this.sortOrder = defaultTo(options.sortOrder, 'desc');
		this.hitsCount = defaultTo(options.hitsCount, 10);
		this.includeFields = defaultTo(options.includeFields, null);
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

	setSortField(sortField) {
		this.sortField = sortField;
	}

	setSortOrder(sortOrder) {
		this.sortOrder = sortOrder;
	}

	setHitsCount(hitsCount) {
		this.hitsCount = hitsCount;
	}

	setIncludeFields(includeFields) {
		this.includeFields = includeFields;
	}

	getTile(name = 'macro-edge') {
		const params = {
			srcXField: this.srcXField,
			srcYField: this.srcYField,
			dstXField: this.dstXField,
			dstYField: this.dstYField,
			left: this.left,
			right: this.right,
			bottom: this.bottom,
			top: this.top,
			lod: this.lod,
			sortField: this.sortField,
			sortOrder: this.sortOrder,
			hitsCount: this.hitsCount,
			includeFields: this.includeFields
		};
		const tile = {};
		tile[name] = params;
		return tile;
	}
}

module.exports = MacroEdge;
