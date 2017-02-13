'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const Line = require('../shape/Line');

class MacroEdge extends lumo.WebGLVertexRenderer {

	constructor(options = {}) {
		super(options);
		this.line = null;
		this.atlas = null;
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
	}

	addTile(atlas, tile) {
		const edges = (this.layer.lod > 0) ? tile.data.edges : tile.data;
		atlas.set(
			tile.coord.hash,
			edges,
			edges.length / (atlas.stride * 2));
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

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(this.layer.opacity);
		return this;
	}

}

module.exports = MacroEdge;
