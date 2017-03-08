'use strict';

const clamp = require('lodash/clamp');

const SIGMOID_SCALE = 0.15;

// log10

function log10Transform(val, min, max) {
	const logMin = Math.log10(min || 1);
	const logMax = Math.log10(max || 1);
	const logVal = Math.log10(val || 1);
	return (logVal - logMin) / ((logMax - logMin) || 1);
}

function inverseLog10Transform(nval, min, max) {
	const logMin = Math.log10(min || 1);
	const logMax = Math.log10(max || 1);
	return Math.pow(10, (nval * logMax - nval * logMin) + logMin);
}

// sigmoid

function sigmoidTransform(val, min, max) {
	const absMin = Math.abs(min);
	const absMax = Math.abs(max);
	const distance = Math.max(absMin, absMax);
	const scaledVal = val / (SIGMOID_SCALE * distance);
	return 1 / (1 + Math.exp(-scaledVal));
}

function inverseSigmoidTransform(nval, min, max) {
	const absMin = Math.abs(min);
	const absMax = Math.abs(max);
	const distance = Math.max(absMin, absMax);
	if (nval === 0) {
		return -distance;
	}
	if (nval === 1) {
		return distance;
	}
	return Math.log((1/nval) - 1) * -(SIGMOID_SCALE * distance);
}

// linear

function linearTransform(val, min, max) {
	const range = max - min;
	if (range === 0) {
		return 1;
	}
	return (val - min) / range;
}

function inverseLinearTransform(nval, min, max) {
	const range = max - min;
	if (range === 0) {
		return 1;
	}
	return min + nval * range;
}

const Transform = {
	linear: linearTransform,
	log10: log10Transform,
	sigmoid: sigmoidTransform
};

const Inverse = {
	linear: inverseLinearTransform,
	log10: inverseLog10Transform,
	sigmoid: inverseSigmoidTransform
};

const interpolate = function(nval, range) {
	// interpolate between the filter range
	const rMin = range.min;
	const rMax = range.max;
	const rval = (nval - rMin) / (rMax - rMin);
	// ensure output is [0:1]
	return clamp(rval, 0, 1);
};

const transform = function(val, type, extrema) {
	// clamp the value between the extreme (shouldn't be necessary)
	const min = extrema.min;
	const max = extrema.max;
	const clamped = clamp(val, min, max);
	// normalize the value
	if (min !== max) {
		return Transform[type](clamped, min, max);
	}
	// if min === max, always return 1
	return 1;
};

const untransform = function(nval, type, extrema) {
	const min = extrema.min;
	const max = extrema.max;
	// clamp the value between the extreme (shouldn't be necessary)
	const clamped = clamp(nval, min, max);
	// unnormalize the value
	if (min !== max) {
		return Inverse[type](clamped, min, max);
	}
	// if min === max, always return 1
	return 1;
};

module.exports = {
	transform: transform,
	untransform: untransform,
	interpolate: interpolate
};
