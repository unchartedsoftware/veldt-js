'use strict';

const lumo = require('lumo');
const ColorRamp = require('../color/ColorRamp');

const addTransformDefine = function(shader ,transform) {
	const define = shader.define || {};
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

module.exports = {
	common: `
		precision highp float;

		uniform float uRangeMin;
		uniform float uRangeMax;
		uniform float uMin;
		uniform float uMax;
		uniform float uColorRampSize;
		uniform sampler2D uColorRampSampler;

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

		vec4 colorRampLookup(float val) {
			float nval = transform(val);
			float rval = interpolateToRange(nval);
			float maxIndex = uColorRampSize * uColorRampSize - 1.0;
			float lookup = rval * maxIndex;
			float x = mod(lookup, uColorRampSize);
			float y = floor(lookup / uColorRampSize);
			float pixel = 1.0 / uColorRampSize;
			float tx = (x / uColorRampSize) + (pixel * 0.5);
			float ty = (y / uColorRampSize) + (pixel * 0.5);
			return texture2D(uColorRampSampler, vec2(tx, ty));
		}
	`,
	addTransformDefine: addTransformDefine,
	createRampTexture: createRampTexture
};
