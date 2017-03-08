'use strict';

const get = require('lodash/get');
const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const Ring = require('../shape/Ring');

class Community extends lumo.WebGLInteractiveRenderer {

	constructor(options = {}) {
		super(options);
		this.atlas = null;
		this.ringFill = null;
		this.ringOutline = null;
		this.color = defaultTo(options.color, [ 1.0, 1.0, 1.0, 1.0 ]);
		this.outlineColor = defaultTo(options.outlineColor, [ 0.0, 0.0, 0.0, 1.0 ]);
		this.highlightedColor = defaultTo(options.highlightedColor, [ 1.0, 0.5, 1.0, 1.0 ]);
		this.selectedColor = defaultTo(options.selectedColor, [ 1.0, 0.5, 1.0, 1.0 ]);
		this.ringWidth = defaultTo(options.ringWidth, 2);
		this.ringOffset = defaultTo(options.ringOffset, 0);
		this.outlineWidth = defaultTo(options.outlineWidth, 1);
		this.radiusField = defaultTo(options.radiusField, 'radius');
	}

	onAdd(layer) {
		super.onAdd(layer);
		// ring fill
		this.ringFill = new Ring(this, this.ringWidth);
		// ring outline
		this.ringOutline = new Ring(this, this.ringWidth + (this.outlineWidth * 2));
		// offset atlas
		this.atlas = this.createVertexAtlas({
			// offset
			1: {
				size: 2,
				type: 'FLOAT'
			},
			// radius
			2: {
				size: 1,
				type: 'FLOAT'
			}
		});
		return this;
	}

	onRemove(layer) {
		this.destroyVertexAtlas(this.atlas);
		this.atlas = null;
		this.ringFill = null;
		this.ringOutline = null;
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

		const radiusScale = Math.pow(2, coord.z);
		const ringOffset = this.ringOffset;
		const totalOffset =
			(this.ringWidth / 2) + // width
			this.outlineWidth + // outline
			this.ringOffset; // offset

		const points = new Array(positions.length / 2);
		const vertices = new Float32Array((positions.length / 2) * 3);

		for (let i=0; i<positions.length/2; i++) {

			const hit = hits[i];
			const x = positions[i*2];
			const y = positions[i*2+1];
			const radius = get(hit, radiusField) * radiusScale + ringOffset;

			// plot pixel coords
			const px = x + xOffset;
			const py = y + yOffset;

			points[i] = {
				x: x,
				y: y,
				radius: radius,
				minX: px - (radius + totalOffset),
				maxX: px + (radius + totalOffset),
				minY: py - (radius + totalOffset),
				maxY: py + (radius + totalOffset),
				tile: tile,
				data: hit
			};

			vertices[i*3] = x;
			vertices[i*3+1] = y;
			vertices[i*3+2] = radius;
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
			this.color,
			opacity);

		// render selected
		this.selected.forEach(selected => {
			this.ringFill.drawIndividual(
				selected,
				this.selectedColor,
				opacity);
		});

		// render highlighted
		if (this.highlighted &&
			this.selected.indexOf(this.highlighted) === -1) {
			this.ringFill.drawIndividual(
				this.highlighted,
				this.highlightedColor,
				opacity);
		}

		return this;
	}

}

module.exports = Community;
