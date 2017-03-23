'use strict';

module.exports = {
	common: `
		precision highp float;
		uniform float uBrightness;
		vec4 brightnessTransform(vec4 color) {
			return vec4(
				color.r * uBrightness,
				color.g * uBrightness,
				color.b * uBrightness,
				color.a);
		}
	`
};
