'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const Shaders = require('./Shaders');

// Private Methods

const renderTiles = function(gl, atlas, shader, plot, renderables, color, radius) {
	// get projection
	const proj = plot.viewport.getOrthoMatrix();

	// bind render target
	plot.renderBuffer.bind();

	// clear render target
	gl.clear(gl.COLOR_BUFFER_BIT);

	// set blending func
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

	// bind shader
	shader.use();

	// set uniforms
	shader.setUniform('uProjectionMatrix', proj);
	shader.setUniform('uColor', color);
	shader.setUniform('uRadius', radius);
	shader.setUniform('uPixelRatio', plot.pixelRatio);

	// binds the buffer to instance
	atlas.bind();

	// for each renderable
	renderables.forEach(renderable => {
		shader.setUniform('uTileScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);
		atlas.draw(renderable.hash, 'POINTS');
	});

	// unbind
	atlas.unbind();

	// unbind render target
	plot.renderBuffer.unbind();
};

class Macro extends lumo.WebGLVertexRenderer {

	constructor(options = {}) {
		super(options);
		this.shader = null;
		this.atlas = null;
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.radius = defaultTo(options.radius, 2);
	}

	onAdd(layer) {
		super.onAdd(layer);
		// get the extension for standard derivatives
		this.ext = this.gl.getExtension('OES_standard_derivatives');
		this.shader = this.createShader(Shaders.macro);
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
		this.shader = null;
		this.atlas = null;
		super.onRemove(layer);
		return this;
	}

	draw() {
		// render the tiles
		renderTiles(
			this.gl,
			this.atlas,
			this.shader,
			this.layer.plot,
			this.getRenderables(),
			this.color);
		// render framebuffer to the backbuffer
		this.layer.plot.renderBuffer.blitToScreen(this.layer.opacity);
		return this;
	}
}

module.exports = Macro;
