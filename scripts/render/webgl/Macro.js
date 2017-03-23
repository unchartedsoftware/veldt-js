'use strict';

const defaultTo = require('lodash/defaultTo');
const VertexRenderer = require('./VertexRenderer');
const Point = require('../shape/Point');

class Macro extends VertexRenderer {

	constructor(options = {}) {
		super(options);
		this.atlas = null;
		this.point = null;
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.radius = defaultTo(options.radius, 2);
	}

	addTile(atlas, tile) {
		const bins = (this.layer.lod > 0) ? tile.data.points : tile.data;
		atlas.set(
			tile.coord.hash,
			bins,
			bins.length / atlas.stride);
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
		this.point = null;
		this.atlas = null;
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

		// draw instanced points
		this.point.drawInstanced(
			this.atlas,
			this.radius,
			this.color);

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(layer.opacity);

		return this;
	}
}

module.exports = Macro;
