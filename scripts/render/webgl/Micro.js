'use strict';

const defaultTo = require('lodash/defaultTo');
const InteractiveRenderer = require('./InteractiveRenderer');
const Point = require('../shape/Point');

const POINT_RADIUS = 8;
const POINT_RADIUS_INC = 4;

// const applyJitter = function(point, maxDist) {
// 	const angle = Math.random() * (Math.PI * 2);
// 	const dist = Math.random() * maxDist;
// 	point.x += Math.floor(Math.cos(angle) * dist);
// 	point.y += Math.floor(Math.sin(angle) * dist);
// };

class Micro extends InteractiveRenderer {

	constructor(options = {}) {
		super(options);
		this.point = null;
		this.atlas = null;
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.radius = defaultTo(options.radius, POINT_RADIUS);
		// this.jitter = defaultTo(options.radius, true);
		// this.jitterDistance = defaultTo(options.jitterDistance, 10);
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

		const points = new Array(vertices.length / 2);

		// const collisions = {};

		for (let i=0; i<vertices.length / 2; i++) {

			const x = vertices[i*2];
			const y = vertices[i*2+1];

			// add jitter if specified
			// if (this.jitter) {
			// 	const hash = `${px.x}:${px.y}`;
			// 	if (collisions[hash]) {
			// 		applyJitter(px, this.jitterDistance);
			// 	}
			// 	collisions[hash] = true;
			// }

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
		this.point = new Point(this);
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
		this.point = null;
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
		this.point.drawInstanced(
			this.atlas,
			this.radius,
			this.color);

		// render selected
		this.selected.forEach(selected => {
			this.point.drawIndividual(
				selected,
				this.radius + POINT_RADIUS_INC * 2,
				this.color);
		});

		// render highlighted
		if (this.highlighted &&
			this.selected.indexOf(this.highlighted) === -1) {
			this.point.drawIndividual(
				this.highlighted,
				this.radius + POINT_RADIUS_INC,
				this.color);
		}

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(this.layer.opacity);
		return this;
	}

}

module.exports = Micro;
