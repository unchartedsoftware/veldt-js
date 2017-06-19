'use strict';

const get = require('lodash/get');
const lumo = require('lumo');
const flatten = require('lodash/flatten');
const defaultTo = require('lodash/defaultTo');
const WebGLRenderer = require('./WebGLRenderer');
const Ring = require('./shape/Ring');
const ColorRamp = require('../color/ColorRamp');
const RadialQuad = require('./shape/RadialQuad');
const SegmentedRing = require('./shape/SegmentedRing');

const addTile = function(atlas, tile) {
	const coord = tile.coord;
	const data = tile.data;
	const hits = data.hits;
	const points = data.points;
	const numPoints = points.length / 2;
	const radiusField = this.radiusField;
	const bucketsField = this.bucketsField;
	const radiusScale = Math.pow(2, coord.z);
	const totalOffset =
		(this.ringWidth / 2) + // width
		this.outlineWidth + // outline
		this.ringOffset; // offset
	const stride = atlas.stride;
	const vertices = new Float32Array(numPoints * stride);

	for (let i=0; i<numPoints; i++) {
		const hit = hits[i];
		const x = points[i*2];
		const y = points[i*2+1];
		const radius = get(hit, radiusField) * radiusScale + totalOffset;
		const buckets = get(hit, bucketsField);

		// sum buckets
		let sum = 0;
		for (let j=0; j<buckets.length; j++) {
			sum += buckets[j];
		}

		// get cumulative percentages
		const percentages = [
			0, 0, 0, 0,
			0, 0, 0, 0,
			0, 0, 0, 0,
			0, 0, 0, 0
		];
		let current = 0;
		for (let j=0; j<buckets.length; j++) {
			percentages[j] = (current + buckets[j]) / sum;
			current += buckets[j];
		}

		vertices[i*stride] = x;
		vertices[i*stride+1] = y;
		vertices[i*stride+2] = radius;
		vertices[i*stride+3] = percentages[0];
		vertices[i*stride+4] = percentages[1];
		vertices[i*stride+5] = percentages[2];
		vertices[i*stride+6] = percentages[3];
		vertices[i*stride+7] = percentages[4];
		vertices[i*stride+8] = percentages[5];
		vertices[i*stride+9] = percentages[6];
		vertices[i*stride+10] = percentages[7];
		vertices[i*stride+11] = percentages[8];
		vertices[i*stride+12] = percentages[9];
		vertices[i*stride+13] = percentages[10];
		vertices[i*stride+14] = percentages[11];
		vertices[i*stride+15] = percentages[12];
		vertices[i*stride+16] = percentages[13];
		vertices[i*stride+17] = percentages[14];
		vertices[i*stride+18] = percentages[15];
	}

	atlas.set(coord.hash, vertices, points.length);
};

const createCollidables = function(tile, xOffset, yOffset) {
	const data = tile.data;
	const hits = data.hits;
	const points = data.points;
	const numHits = hits ? hits.length : 0;
	const radiusScale = Math.pow(2, tile.coord.z);
	const radiusField = this.radiusField;
	const totalOffset =
		(this.ringWidth / 2) + // width
		this.outlineWidth + // outline
		this.ringOffset; // offset
	const collidables = new Array(numHits);
	const width =
		this.ringWidth +
		(this.outlineWidth * 2) +
		(this.radiusCollisionTolerance * 2);
	for (let i=0; i<numHits; i++) {
		const hit = hits[i];
		const x = points[i*2];
		const y = points[i*2+1];
		const radius = get(hit, radiusField) * radiusScale + totalOffset;
		collidables[i] = new lumo.RingCollidable(
			x,
			y,
			radius,
			width,
			xOffset,
			yOffset,
			tile,
			hit);
	}
	return collidables;
};

class CommunityBucket extends WebGLRenderer {

	constructor(options = {}) {
		super(options);
		this.ringFill = null;
		this.ringOutline = null;
		this.quad = null;
		this.atlas = null;
		this.tree = null;
		this.outlineWidth = defaultTo(options.outlineWidth, 1);
		this.outlineColor = defaultTo(options.outlineColor, [0.0, 0.0, 0.0, 1.0]);
		this.ringWidth = defaultTo(options.ringWidth, 3);
		this.ringOffset = defaultTo(options.ringOffset, 0);
		this.tickWidth = defaultTo(options.tickWidth, 2);
		this.tickHeight = defaultTo(options.tickHeight, 8);
		this.radiusField = defaultTo(options.radiusField, 'radius');
		this.numBuckets = defaultTo(options.numBuckets, 4);
		this.bucketsField = defaultTo(options.bucketsField, 'buckets');
		this.colorRamp = defaultTo(options.colorRamp, 'verdant');
		const buckets = ColorRamp.getBuckets(this.colorRamp, this.numBuckets + 2);
		this.colors = flatten(buckets.slice(0, this.numBuckets));
		this.highlightedColors = flatten(buckets.slice(1, this.numBuckets+1));
		this.selectedColors = flatten(buckets.slice(2, this.numBuckets+2));
		this.radiusCollisionTolerance = defaultTo(options.radiusCollisionTolerance, 4);
	}

	onAdd(layer) {
		super.onAdd(layer);
		const fullWidth = this.ringWidth + (this.outlineWidth * 2);
		this.ringFill = new SegmentedRing(this, this.ringWidth, this.numBuckets);
		this.ringOutline = new Ring(this, fullWidth);
		this.quad = new RadialQuad(
			this,
			-this.tickWidth/2,
			this.tickWidth/2,
			-fullWidth/2,
			this.tickHeight);
		// vertex atlas for all tiles
		this.atlas = this.createVertexAtlas({
			chunkSize: this.layer.hitsCount,
			attributePointers: {
				// offset
				1: {
					type: 'FLOAT',
					size: 2
				},
				// radius
				2: {
					type: 'FLOAT',
					size: 1
				},
				// percentages
				3: {
					type: 'FLOAT',
					size: 4
				},
				4: {
					type: 'FLOAT',
					size: 4
				},
				5: {
					type: 'FLOAT',
					size: 4
				},
				6: {
					type: 'FLOAT',
					size: 4
				}
			},
			onAdd: addTile.bind(this)
		});
		// r-tree
		this.tree = this.createRTreePyramid({
			createCollidables: createCollidables.bind(this)
		});
		return this;
	}

	onRemove(layer) {
		this.destroyVertexAtlas(this.atlas);
		this.destroyRTreePyramid(this.tree);
		this.tree = null;
		this.ringFill = null;
		this.ringOutline = null;
		this.quad = null;
		this.atlas = null;
		super.onRemove(layer);
		return this;
	}

	pick(pos) {
		if (this.layer.plot.isZooming()) {
			return null;
		}
		return this.tree.searchPoint(
			pos.x,
			pos.y,
			this.layer.plot.zoom,
			this.layer.plot.getPixelExtent());
	}

	draw() {
		const gl = this.gl;
		const layer = this.layer;
		const opacity = layer.getOpacity();

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// draw outline
		this.ringOutline.drawInstanced(
			this.atlas,
			this.outlineColor,
			opacity);

		// draw fill
		this.ringFill.drawInstanced(
			this.atlas,
			this.colors,
			opacity);

		// render selected
		const selection = layer.getSelected();
		for (let i=0; i<selection.length; i++) {
			const selected = selection[i];
			this.ringFill.drawIndividual(
				selected,
				this.selectedColors,
				opacity);
		}

		// render highlighted
		if (layer.highlighted && !layer.isSelected(layer.highlighted)) {
			this.ringFill.drawIndividual(
				layer.highlighted,
				this.highlightedColors,
				opacity);
		}

		// draw radial ticks
		this.quad.drawInstanced(
			this.atlas,
			this.outlineColor,
			0.0,
			opacity);

		return this;
	}
}

module.exports = CommunityBucket;
