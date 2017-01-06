'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');
const Ring = require('../shape/Ring');
const Quad = require('../shape/Quad');
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
		this.bucketsField = defaultTo(options.bucketsField, 'buckets');
		this.colors = defaultTo(options.colors, [
			0.1, 0.1, 0.1, 1.0,
			0.2, 0.2, 0.2, 1.0,
			0.4, 0.4, 0.4, 1.0,
			0.8, 0.8, 0.8, 1.0 ]);
		this.highlightedColors = defaultTo(options.highlightedColors, [
			0.3, 0.3, 0.3, 1.0,
			0.4, 0.4, 0.4, 1.0,
			0.6, 0.6, 0.6, 1.0,
			1.0, 1.0, 1.0, 1.0 ]);
		this.selectedColors = defaultTo(options.selectedColors, [
			0.3, 0.3, 0.3, 1.0,
			0.4, 0.4, 0.4, 1.0,
			0.6, 0.6, 0.6, 1.0,
			1.0, 1.0, 1.0, 1.0 ]);
	}

	onAdd(layer) {
		super.onAdd(layer);
		const fullWidth = this.ringWidth + this.outlineWidth;
		this.ringFill = new SegmentedRing(this, this.ringWidth, 4);
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
				size: 3
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

		const points = new Array(positions.length / 2);
		const vertices = new Float32Array((positions.length / 2) * 6);

		const counts = [0, 0, 0];

		for (let i=0; i<positions.length/2; i++) {

			const hit = hits[i];
			const x = positions[i*2];
			const y = positions[i*2+1];
			const radius = hit[radiusField] * radiusScale + outlineOffset;
			const buckets = [ 25, 25, 25, 25 ]; //hit[bucketsField];

			// plot pixel coords
			const px = x + xOffset;
			const py = y + yOffset;

			// sum buckets
			const sum = buckets[0] + buckets[1] + buckets[2] + buckets[3];
			// counts
			counts[0] = buckets[0];
			counts[1] = buckets[0] + buckets[1];
			counts[2] = buckets[0] + buckets[1] + buckets[2];
			// percantages
			const percentages = [
				counts[0] / sum,
				counts[1] / sum,
				counts[2] / sum
			];

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

			vertices[i*6] = x;
			vertices[i*6+1] = y;
			vertices[i*6+2] = radius;
			vertices[i*6+3] = percentages[0];
			vertices[i*6+4] = percentages[1];
			vertices[i*6+5] = percentages[2];
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
