'use strict';

const clamp = require('lodash/clamp');
const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const ColorRamp = require('../color/ColorRamp');

const SHADER = {
	vert:
		`
		precision highp float;

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
		precision highp float;

		uniform float uOpacity;
		uniform float uRangeMin;
		uniform float uRangeMax;
		uniform float uMin;
		uniform float uMax;
		uniform sampler2D uTextureSampler;
		uniform sampler2D uColorRampSampler;
		uniform float uColorRampSize;

		varying vec2 vTextureCoord;

		float decodeRGBAToFloat(vec4 v) {
			return
				(v.x * 255.0) +
				(v.y * 255.0 * 256.0) +
				(v.z * 255.0 * 65536.0) +
				(v.w * 255.0 * 16777216.0);
		}

		float log10(float val) {
			return log(val) / log(10.0);
		}

		float log10Transform(float val, float minVal, float maxVal) {
			if (minVal < 1.0) { minVal = 1.0; }
			if (maxVal < 1.0) { maxVal = 1.0; }
			if (val < 1.0) { val = 1.0; }
			float logMin = log10(minVal);
			float logMax = log10(maxVal);
			float logVal = log10(val);
			float range = logMax - logMin;
			if (range == 0.0) { range = 1.0; }
			return (logVal - logMin) / range;
		}

		float sigmoidTransform(float val, float minVal, float maxVal) {
			minVal = abs(minVal);
			maxVal = abs(maxVal);
			float dist = max(minVal, maxVal);
			float SIGMOID_SCALE = 0.15;
			float scaledVal = val / (SIGMOID_SCALE * dist);
			return 1.0 / (1.0 + exp(-scaledVal));
		}

		float linearTransform(float val, float minVal, float maxVal) {
			float range = maxVal - minVal;
			if (range == 0.0) { range = 1.0; }
			return (val - minVal) / range;
		}

		float transform(float val) {
			val = clamp(val, uMin, uMax);
			#ifdef LINEAR_TRANSFORM
				return linearTransform(val, uMin, uMax);
			#else
				#ifdef SIGMOID_TRANSFORM
					return sigmoidTransform(val, uMin, uMax);
				#else
					return log10Transform(val, uMin, uMax);
				#endif
			#endif
		}

		float interpolateToRange(float nval) {
			float rval = (nval - uRangeMin) / (uRangeMax - uRangeMin);
			return clamp(rval, 0.0, 1.0);
		}

		vec4 colorRamp(float value) {
			float maxIndex = uColorRampSize * uColorRampSize - 1.0;
			float lookup = value * maxIndex;
			float x = mod(lookup, uColorRampSize);
			float y = floor(lookup / uColorRampSize);
			float pixel = 1.0 / uColorRampSize;
			float tx = (x / uColorRampSize) + (pixel * 0.5);
			float ty = (y / uColorRampSize) + (pixel * 0.5);
			return texture2D(uColorRampSampler, vec2(tx, ty));
		}

		void main() {
			vec4 enc = texture2D(uTextureSampler, vTextureCoord);
			float count = decodeRGBAToFloat(enc);
			if (count == 0.0) {
				discard;
			}
			float nval = transform(count);
			float rval = interpolateToRange(nval);
			vec4 color = colorRamp(rval);
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

const addTransformDefine = function(shader ,transform) {
	const define = {};
	switch (transform) {
		case 'linear':
			define.LINEAR_TRANSFORM = 1;

		case 'sigmoid':
			define.SIGMOID_TRANSFORM = 1;

		default:
			define.LOG_TRANSFORM = 1;
	}
	shader.define = define;
	return shader;
};

const createRampTexture = function(gl, type) {
	const table = ColorRamp.getTable(type);
	const size = Math.sqrt(table.length / 4);
	const texture = new lumo.Texture(gl, null, {
		filter: 'NEAREST'
	});
	texture.bufferData(table, size, size);
	return texture;
};

class Heatmap extends lumo.WebGLTextureRenderer {

	constructor(options = {}) {
		options.filter = 'NEAREST';
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
		this.shader = this.createShader(
			addTransformDefine(SHADER, this.transform));
		this.array = this.createTextureArray(layer.resolution);
		this.ramp = createRampTexture(this.gl, this.colorRamp);
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
			addTransformDefine(SHADER, this.transform));
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
		this.ramp = createRampTexture(this.gl, this.colorRamp);
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

		// bind colo ramp
		ramp.bind(1);

		let last;
		// for each renderable
		renderables.forEach(renderable => {
			const hash = renderable.hash;
			if (last !== hash) {
				// bind texture
				array.bind(hash, 0);
				last = hash;
			}
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
