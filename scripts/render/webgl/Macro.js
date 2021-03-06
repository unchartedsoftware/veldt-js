'use strict';

const defaultTo = require('lodash/defaultTo');
const WebGLRenderer = require('./WebGLRenderer');
const Point = require('./shape/Point');

const addTile = function(atlas, tile) {
	const bins = (this.layer.lod > 0) ? tile.data.points : tile.data;
	atlas.set(
		tile.coord.hash,
		bins,
		bins.length / atlas.stride);
};

class Macro extends WebGLRenderer {

	constructor(options = {}) {
		super(options);
		this.atlas = null;
		this.point = null;
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.outlineColor = defaultTo(options.outlineColor, [ 0.0, 0.0, 0.0, 1.0 ]);
		this.outlineWidth = defaultTo(options.outlineWidth, 2.0);
		this.radius = defaultTo(options.radius, 2);
	}

	onAdd(layer) {
		super.onAdd(layer);
		this.point = new Point(this);
		this.atlas = this.createVertexAtlas({
			chunkSize: this.layer.resolution * this.layer.resolution,
			attributePointers: {
				// position
				0: {
					size: 2,
					type: 'FLOAT'
				}
			},
			onAdd: addTile.bind(this)
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
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		// draw instanced points
		this.point.drawInstanced(
			this.atlas,
			this.radius,
			this.color,
			this.outlineWidth,
			this.outlineColor);

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(layer.getOpacity());

		return this;
	}
}

module.exports = Macro;
