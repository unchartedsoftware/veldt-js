'use strict';

/**
 * precision
 */
const precision =
	`
	precision highp float;
	precision highp int;
	`;

/**
 * decode float
 */
const decodeRGBAToFloat =
	`
	float decodeRGBAToFloat(vec4 v) {
		return
			(v.x * 255.0) +
			(v.y * 255.0 * 256.0) +
			(v.z * 255.0 * 65536.0) +
			(v.w * 255.0 * 16777216.0);
	}
	`;

/**
 * transforms
 */

// log10
const log10Transform =
	`
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
	`;

// sigmoid
const sigmoidTransform =
	`
	float sigmoidTransform(float val, float minVal, float maxVal) {
		minVal = abs(minVal);
		maxVal = abs(maxVal);
		float dist = max(minVal, maxVal);
		float SIGMOID_SCALE = 0.15;
		float scaledVal = val / (SIGMOID_SCALE * dist);
		return 1.0 / (1.0 + exp(-scaledVal));
	}
	`;

// linear
const linearTransform =
	`
	float linearTransform(float val, float minVal, float maxVal) {
		float range = maxVal - minVal;
		if (range == 0.0) { range = 1.0; }
		return (val - minVal) / range;
	}
	`;

const transform =
	log10Transform +
	sigmoidTransform +
	linearTransform +
	`
	#define LOG_TRANSFORM 0
	#define LINEAR_TRANSFORM 1
	#define SIGMOID_TRANSFORM 2
	uniform int uTransformType;
	uniform float uMin;
	uniform float uMax;
	float transform(float val) {
		if (val < uMin) { val = uMin; }
		if (val > uMax) { val = uMax; }
		if (uTransformType == LINEAR_TRANSFORM) {
			return linearTransform(val, uMin, uMax);
		} else if (uTransformType == SIGMOID_TRANSFORM) {
			return sigmoidTransform(val, uMin, uMax);
		}
		return log10Transform(val, uMin, uMax);
	}
	`;

/**
 * Color ramp
 */
const colorRamp =
	`
	uniform sampler2D uColorRampSampler;
	uniform float uColorRampSize;
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
	`;

/**
 * Value Range
 */
const valueRange =
	`
	uniform float uRangeMin;
	uniform float uRangeMax;
	float interpolateToRange(float nval) {
		float rval = (nval - uRangeMin) / (uRangeMax - uRangeMin);
		return clamp(rval, 0.0, 1.0);
	}
	`;

/**
 * heatmap shader
 */
const heatmap = {
	vert:
		precision +
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
		precision +
		decodeRGBAToFloat +
		transform +
		colorRamp +
		valueRange +
		`
		uniform sampler2D uTextureSampler;
		uniform float uOpacity;
		varying vec2 vTextureCoord;
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

/**
 * micro shader
 */
const micro = {
	vert:
		precision +
		`
		attribute vec2 aPosition;
		uniform float uRadius;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform float uPixelRatio;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uScale) + uTileOffset;
			gl_PointSize = uRadius * 2.0 * uPixelRatio;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		precision +
		`
		#ifdef GL_OES_standard_derivatives
			#extension GL_OES_standard_derivatives : enable
		#endif
		uniform vec4 uColor;
		void main() {
			vec2 cxy = 2.0 * gl_PointCoord - 1.0;
			float radius = dot(cxy, cxy);
			float alpha = 1.0;
			#ifdef GL_OES_standard_derivatives
				float delta = fwidth(radius);
				alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, radius);
			#else
				if (radius > 1.0) {
					discard;
				}
			#endif
			gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
		}
		`
};

// macro renderer
const macro = {
	vert:
		precision +
		`
		precision highp float;
		attribute vec2 aPosition;
		uniform float uRadius;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform vec2 uLODOffset;
		uniform float uLODScale;
		uniform float uPixelRatio;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uScale * uLODScale) + (uTileOffset + (uScale * uLODOffset));
			gl_PointSize = uRadius * 2.0 * uPixelRatio;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		precision +
		`
		#ifdef GL_OES_standard_derivatives
			#extension GL_OES_standard_derivatives : enable
		#endif
		precision highp float;
		uniform vec4 uColor;
		void main() {
			vec2 cxy = 2.0 * gl_PointCoord - 1.0;
			float radius = dot(cxy, cxy);
			float alpha = 1.0;
			#ifdef GL_OES_standard_derivatives
				float delta = fwidth(radius);
				alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, radius);
			#else
				if (radius > 1.0) {
					discard;
				}
			#endif
			gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
		}
		`
};

module.exports = {
	/**
	 * heatmap shader
	 */
	heatmap: heatmap,

	/**
	 * micro shader
	 */
	micro: micro,

	/**
	 * macro shader
	 */
	macro: macro
};
