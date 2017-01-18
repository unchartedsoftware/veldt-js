'use strict';

const _ = require('lodash');
const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');
const Ring = require('../shape/Ring');
const ColorRamp = require('../color/ColorRamp');
//const Quad = require('../shape/Quad');
const SegmentedRing = require('../shape/SegmentedRing');

class CommunityBucket extends lumo.WebGLInteractiveRenderer {

	constructor(options = {}) {
		super(options);

		this.ringFill = null;
		this.ringOutline = null;
		this.quad = null;
		this.atlas = null;

		this.highlighted = null;
		this.selected = null;

		this.outlineWidth = defaultTo(options.outlineWidth, 2);
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
		this.colors = _.flatten(buckets.slice(0, this.numBuckets));
		this.highlightedColors = _.flatten(buckets.slice(1, this.numBuckets+1));
		this.selectedColors = _.flatten(buckets.slice(2, this.numBuckets+2));
	}

	onAdd(layer) {
		super.onAdd(layer);
		const fullWidth = this.ringWidth + this.outlineWidth;
		this.ringFill = new SegmentedRing(this, this.ringWidth, this.numBuckets);
		this.ringOutline = new Ring(this, fullWidth);
		// quad vertexbuffer
		// this.quad = new Quad(
		// 	this,
		// 	-this.tickWidth/2,
		// 	this.tickWidth/2,
		// 	-fullWidth/2,
		// 	this.tickHeight);
		// vertex atlas for all tiles
		this.atlas = this.createVertexAtlas({
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
		});
		return this;
	}

	onRemove(layer) {
		this.destroyVertexAtlas(this.atlas);
		this.ringFill = null;
		this.ringOutline = null;
		this.quad = null;
		this.atlas = null;
		super.onRemove(layer);
		return this;
	}

	addTile(atlas, tile) {
		const coord = tile.coord;
		const data = tile.data;
		const hits = data.hits;
		const positions = data.points;

		const tileSize = this.layer.plot.tileSize;
		const xOffset = coord.x * tileSize;
		const yOffset = coord.y * tileSize;
		const radiusField = this.radiusField;
		const bucketsField = this.bucketsField;

		const radiusScale = Math.pow(2, coord.z);
		const outlineOffset = this.outlineWidth;

		const stride = atlas.stride;
		const points = new Array(positions.length / 2);
		const vertices = new Float32Array((positions.length / 2) * stride);

		for (let i=0; i<positions.length/2; i++) {

			const hit = hits[i];
			const x = positions[i*2];
			const y = positions[i*2+1];
			const radius = hit[radiusField] * radiusScale + outlineOffset;
			const buckets = hit[bucketsField];

			// plot pixel coords
			const px = x + xOffset;
			const py = y + yOffset;

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
				0, 0, 0, 0 ];
			let current = 0;
			for (let j=0; j<buckets.length; j++) {
				percentages[j] = (current + buckets[j]) / sum;
				current += buckets[j];
			}

			points[i] = {
				x: x,
				y: y,
				radius: radius,
				minX: px - radius,
				maxX: px + radius,
				minY: py - radius,
				maxY: py + radius,
				tile: tile,
				data: hit,
				buckets: buckets,
				percentages: percentages
			};

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

		this.addPoints(coord, points);
		atlas.set(coord.hash, vertices, points.length);
	}

	removeTile(atlas, tile) {
		const coord = tile.coord;
		atlas.delete(coord.hash);
		this.removePoints(coord);
	}

	draw() {

		const gl = this.gl;
		const opacity = this.layer.opacity;

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
		if (this.selected) {
			this.ringFill.drawIndividual(
				this.selected,
				this.selectedColors,
				opacity);
		}

		// render highlighted
		if (this.highlighted && this.highlighted !== this.selected) {
			this.ringFill.drawIndividual(
				this.highlighted,
				this.highlightedColors,
				opacity);
		}

		return this;
	}
}

module.exports = CommunityBucket;
