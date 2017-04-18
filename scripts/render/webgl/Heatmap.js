'use strict';

const clamp = require('lodash/clamp');
const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const TextureRenderer = require('./TextureRenderer');
const ColorRamp = require('../color/ColorRamp');
const ColorRampGLSL = require('../shader/ColorRamp');

const SHADER = {
	common: ColorRampGLSL.common,
	vert:
		`
		attribute vec2 aPosition;
		attribute vec2 aTextureCoord;
		uniform vec2 uTileOffset;
		uniform float uScale;
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
		uniform float uOpacity;
		uniform sampler2D uTextureSampler;

		varying vec2 vTextureCoord;

		float decodeRGBAToFloat(vec4 v) {
			return
				(v.x * 255.0) +
				(v.y * 255.0 * 256.0) +
				(v.z * 255.0 * 65536.0) +
				(v.w * 255.0 * 16777216.0);
		}

		void main() {
			vec4 enc = texture2D(uTextureSampler, vTextureCoord);
			float count = decodeRGBAToFloat(enc);
			if (count == 0.0) {
				discard;
			}
			vec4 color = colorRampLookup(count);
			gl_FragColor = vec4(color.rgb, color.a * uOpacity);
		}
		`
};

const createQuad = function(gl, min, max) {
	const vertices = new Float32Array(24);
	// positions
	vertices[0] = min;	vertices[1] = min;
	vertices[2] = max;	vertices[3] = min;
	vertices[4] = max;	vertices[5] = max;
	vertices[6] = min;	vertices[7] = min;
	vertices[8] = max;	vertices[9] = max;
	vertices[10] = min;	vertices[11] = max;
	// uvs
	vertices[12] = 0;	vertices[13] = 0;
	vertices[14] = 1;	vertices[15] = 0;
	vertices[16] = 1;	vertices[17] = 1;
	vertices[18] = 0;	vertices[19] = 0;
	vertices[20] = 1;	vertices[21] = 1;
	vertices[22] = 0;	vertices[23] = 1;
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

class Heatmap extends TextureRenderer {

	constructor(options = {}) {
		super(options);
		this.transform = defaultTo(options.transform, 'log10');
		this.range = defaultTo(options.range, [0, 1]);
		this.colorRamp = defaultTo(options.colorRamp, 'verdant');
		this.quad = null;
		this.shader = null;
		this.array = null;
		this.ramp = null;
	}

	addTile(array, tile) {
		// update chunksize if layer resolution changes
		if (this.array.chunkSize !== this.layer.resolution) {
			this.array.chunkSize = this.layer.resolution;
		}
		array.set(tile.coord.hash, new Uint8Array(tile.data));
	}

	removeTile(array, tile) {
		array.delete(tile.coord.hash);
	}

	onAdd(layer) {
		super.onAdd(layer);
		this.quad = createQuad(this.gl, 0, layer.plot.tileSize);
		this.array = this.createTextureArray(layer.resolution);
		this.setTransform(this.transform);
		this.setColorRamp(this.colorRamp);
		return this;
	}

	onRemove(layer) {
		this.destroyTextureArray(this.array);
		this.quad = null;
		this.shader = null;
		this.array = null;
		super.onRemove(layer);
		return this;
	}

	setTransform(transform) {
		this.transform = transform;
		// re-compile shader
		this.shader = this.createShader(
			ColorRampGLSL.addTransformDefine(SHADER, this.transform));
	}

	getTransform() {
		return this.transform;
	}

	setValueRange(min, max) {
		this.range = [
			clamp(min, 0, 1),
			clamp(max, 0, 1)
		];
	}

	getValueRange() {
		return [
			this.range[0],
			this.range[1]
		];
	}

	setColorRamp(colorRamp) {
		this.colorRamp = colorRamp;
		this.ramp = ColorRampGLSL.createRampTexture(this.gl, this.colorRamp);
	}

	getColorRamp() {
		return this.colorRamp;
	}

	getColorRampFunc() {
		return ColorRamp.getFunc(this.colorRamp);
	}

	draw() {
		const gl = this.gl;
		const shader = this.shader;
		const array = this.array;
		const quad = this.quad;
		const ramp = this.ramp;
		const renderables = this.getRenderables();
		const proj = this.getOrthoMatrix();
		const extrema = this.layer.getExtrema();

		// bind shader
		shader.use();

		// set uniforms
		shader.setUniform('uProjectionMatrix', proj);
		shader.setUniform('uTextureSampler', 0);
		shader.setUniform('uColorRampSampler', 1);
		shader.setUniform('uColorRampSize', ramp.width);
		shader.setUniform('uOpacity', this.layer.opacity);
		shader.setUniform('uRangeMin', this.range[0]);
		shader.setUniform('uRangeMax', this.range[1]);
		shader.setUniform('uMin', extrema.min);
		shader.setUniform('uMax', extrema.max);

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// bind quad
		quad.bind();

		// bind color ramp
		ramp.bind(1);

		// for each renderable
		renderables.forEach(renderable => {
			// bind texture
			array.bind(renderable.hash, 0);
			// set tile uniforms
			shader.setUniform('uScale', renderable.scale);
			shader.setUniform('uTileOffset', renderable.tileOffset);
			// draw
			quad.draw();
			// no need to unbind texture
		});

		// unbind quad
		quad.unbind();
		return this;
	}
}

module.exports = Heatmap;
