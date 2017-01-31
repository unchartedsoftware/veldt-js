'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const Line = require('../shape/Line');

const POINT_RADIUS = 8;

class MicroEdge extends lumo.WebGLInteractiveRenderer {

	constructor(options = {}) {
		super(options);
		this.line = null;
		this.atlas = null;
		this.highlighted = null;
		this.selected = null;
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.radius = defaultTo(options.radius, POINT_RADIUS);
	}

	addTile(atlas, tile) {
		const coord = tile.coord;
		const data = tile.data;
		const hits = data.hits;
		const vertices = data.points;

		const tileSize = this.layer.plot.tileSize;
		const xOffset = coord.x * tileSize;
		const yOffset = coord.y * tileSize;
		const radius = this.radius;

		const pairSize = 4;
		const points = new Array(vertices.length / pairSize);

		for (let i=0; i<vertices.length / pairSize; i++) {

			const x = vertices[i*pairSize];
			const y = vertices[i*pairSize+1];

			// plot pixel coords
			const px = x + xOffset;
			const py = y + yOffset;

			points[i] = {
				x: x,
				y: y,
				radius: radius,
				minX: px - radius,
				maxX: px + radius,
				minY: py - radius,
				maxY: py + radius,
				tile: tile,
				data: hits ? hits[i] : null
			};
		}

		this.addPoints(coord, points);
		atlas.set(coord.hash, vertices, points.length);
	}

	removeTile(atlas, tile) {
		const coord = tile.coord;
		atlas.delete(coord.hash);
		this.removePoints(coord);
	}

	onAdd(layer) {
		super.onAdd(layer);
		this.line = new Line(this);
		this.atlas = this.createVertexAtlas({
			// position
			0: {
				size: 2,
				type: 'FLOAT'
			}
		});
		return this;
	}

	onRemove(layer) {
		this.destroyVertexAtlas(this.atlas);
		this.atlas = null;
		this.line = null;
		super.onRemove(layer);
		return this;
	}

	draw() {

		const gl = this.gl;
		const layer = this.layer;
		const plot = layer.plot;

		// bind render target
		plot.renderBuffer.bind();
		plot.renderBuffer.clear();

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

		// draw instances
		this.line.drawInstanced(
			this.atlas,
			this.color);

		//// render selected
		//if (this.selected) {
		//	this.line.drawIndividual(
		//		this.selected,
		//		this.color);
		//}
        //
		//// render highlighted
		//if (this.highlighted && this.highlighted !== this.selected) {
		//	this.line.drawIndividual(
		//		this.highlighted,
		//		this.color);
		//}

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(this.layer.opacity);
		return this;
	}

}

module.exports = MicroEdge;
