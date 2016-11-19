'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const Shaders = require('./Shaders');

class Macro extends lumo.WebGLVertexRenderer {

	constructor(options = {}) {
		super(options);
		this.shader = null;
		this.atlas = null;
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.radius = defaultTo(options.radius, 2);
	}

	addTile(atlas, tile) {
		const bins = new Float32Array(tile.data);
		atlas.set(
			tile.coord.hash,
			bins,
			bins.length / atlas.stride);
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
		const gl = this.gl;
		const shader = this.shader;
		const atlas = this.atlas;
		const plot = this.layer.plot;
		const renderables = this.getRenderables();
		const proj = this.getOrthoMatrix();

		// bind render target
		plot.renderBuffer.bind();

		// clear render target
		gl.clear(gl.COLOR_BUFFER_BIT);

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

		// bind shader
		shader.use();

		// set global uniforms
		shader.setUniform('uProjectionMatrix', proj);
		shader.setUniform('uColor', this.color);
		shader.setUniform('uRadius', this.radius);
		shader.setUniform('uPixelRatio', plot.pixelRatio);

		// binds the vertex atlas
		atlas.bind();

		// for each renderable
		renderables.forEach(renderable => {
			// set tile uniforms
			shader.setUniform('uScale', renderable.scale);
			shader.setUniform('uTileOffset', renderable.tileOffset);
			// draw the points
			atlas.draw(renderable.hash, 'POINTS');
		});

		// unbind
		atlas.unbind();

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(this.layer.opacity);

		return this;
	}
}

module.exports = Macro;
