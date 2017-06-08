'use strict';

const lumo = require('lumo');

const TILE_ADD = Symbol();
const SHADER_GLSL = {
	vert:
		`
		precision highp float;
		attribute vec2 aPosition;
		attribute vec2 aTextureCoord;
		uniform float uScale;
		uniform vec2 uTileOffset;
		uniform mat4 uProjectionMatrix;
		varying vec2 vTextureCoord;
		void main() {
			vTextureCoord = aTextureCoord;
			vec2 wPosition = (aPosition * uScale) + uTileOffset;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		`
		precision highp float;
		uniform sampler2D uTextureSampler;
		uniform float uOpacity;
		varying vec2 vTextureCoord;
		void main() {
			vec4 color = texture2D(uTextureSampler, vec2(vTextureCoord.x, 1.0 - vTextureCoord.y));
			gl_FragColor = vec4(color.rgb, color.a * uOpacity);
		}
		`
};

const createQuad = function(gl, min, max) {
	const vertices = new Float32Array(24);
	// positions
	vertices[0] = min;	   vertices[1] = min;
	vertices[2] = max;	   vertices[3] = min;
	vertices[4] = max;	   vertices[5] = max;
	vertices[6] = min;	   vertices[7] = min;
	vertices[8] = max;	   vertices[9] = max;
	vertices[10] = min;	   vertices[11] = max;
	// uvs
	vertices[12] = 0;	   vertices[13] = 0;
	vertices[14] = 1;	   vertices[15] = 0;
	vertices[16] = 1;	   vertices[17] = 1;
	vertices[18] = 0;	   vertices[19] = 0;
	vertices[20] = 1;	   vertices[21] = 1;
	vertices[22] = 0;	   vertices[23] = 1;
	// create quad buffer
	return new lumo.VertexBuffer(
		gl,
		vertices,
		{
			0: {
				size: 2,
				type: 'FLOAT',
				byteOffset: 0
			},
			1: {
				size: 2,
				type: 'FLOAT',
				byteOffset: 2 * 6 * 4
			}
		},
		{
			count: 6,
		});
};

class Repeat extends lumo.WebGLTileRenderer {

	constructor(options = {}) {
		super(options);
		this.quad = null;
		this.texture = null;
	}

	onAdd(layer) {
		super.onAdd(layer);
		this.quad = createQuad(this.gl, 0, layer.plot.tileSize);
		this.shader = this.createShader(SHADER_GLSL);
		// create handlers
	 	this[TILE_ADD] = event => {
			if (!this.texture) {
				this.texture = new lumo.Texture(this.gl, event.tile.data);
			}
		};
		// attach handlers
		this.layer.on(lumo.TILE_ADD, this[TILE_ADD]);
		return this;
	}

	onRemove(layer) {
		// detach handlers
		this.layer.removeListener(lumo.TILE_ADD, this[TILE_ADD]);
		// delete handlers
		this[TILE_ADD] = null;
		this.texture = null;
		this.quad = null;
		this.shader = null;
		super.onRemove(layer);
		return this;
	}

	draw() {
		if (!this.texture) {
			return;
		}
		const texture = this.texture;
		const gl = this.gl;
		const shader = this.shader;
		const quad = this.quad;
		const proj = this.getOrthoMatrix();
		const plot = this.layer.plot;
		const viewport = plot.getViewportPixelOffset();

		// bind shader
		shader.use();
		// set global uniforms
		shader.setUniform('uProjectionMatrix', proj);
		shader.setUniform('uTextureSampler', 0);
		shader.setUniform('uOpacity', this.layer.getOpacity());

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// bind texture
		texture.bind(0);

		// bind quad
		quad.bind();

		// get all currently visible tile coords
		const coords = plot.getVisibleCoords();

		// draw the tile
		for (let i=0; i<coords.length; i++) {
			const coord = coords[i];
			const scale = Math.pow(2, plot.zoom - coord.z);
			const tileOffset = [
				(coord.x * scale * plot.tileSize) - viewport.x,
				(coord.y * scale * plot.tileSize) - viewport.y
			];
			// set tile uniforms
			shader.setUniform('uScale', scale);
			shader.setUniform('uTileOffset', tileOffset);
			// draw
			quad.draw();
		}

		// unbind quad
		quad.unbind();
	}
}

module.exports = Repeat;
