(function() {

    'use strict';

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

    const initialize = function() {
        this._range = {
            min: 0,
            max: 1
        };
        this._transformFunc = log10Transform;
        this._inverseFunc = inverseLog10Transform;
    };

    const setTransformFunc = function(type) {
        const func = type.toLowerCase();
        this._transformFunc = Transform[func];
        this._transformType = type;
        this._inverseFunc = Inverse[func];
    };

    const setValueRange = function(range) {
        this._range.min = range.min;
        this._range.max = range.max;
    };

    const getValueRange = function() {
        return this._range;
    };

    const getTransformEnum = function() {
        if (this._transformType === 'linear') {
            return 1;
        } else if (this._transformType === 'sigmoid') {
            return 2;
        }
        return 0;
    };

    const interpolateToRange = function(nval) {
        // interpolate between the filter range
        const rMin = this._range.min;
        const rMax = this._range.max;
        const rval = (nval - rMin) / (rMax - rMin);
        // ensure output is [0:1]
        return Math.max(0, Math.min(1, rval));
    };

    const transformValue = function(val) {
        // clamp the value between the extreme (shouldn't be necessary)
        const min = this._extrema.min;
        const max = this._extrema.max;
        const clamped = Math.max(Math.min(val, max), min);
        // normalize the value
        if (min !== max) {
            return this._transformFunc(clamped, min, max);
        }
        // if min === max, always return 1
        return 1;
    };

    const untransformValue = function(nval) {
        const min = this._extrema.min;
        const max = this._extrema.max;
        // clamp the value between the extreme (shouldn't be necessary)
        const clamped = Math.max(Math.min(nval, 1), 0);
        // unnormalize the value
        if (min !== max) {
            return this._inverseFunc(clamped, min, max);
        }
        // if min === max, always return 1
        return 1;
    };

    module.exports = {
        initialize: initialize,
        setTransformFunc: setTransformFunc,
        setValueRange: setValueRange,
        getValueRange: getValueRange,
        getTransformEnum: getTransformEnum,
        transformValue: transformValue,
        untransformValue: untransformValue,
        interpolateToRange: interpolateToRange
    };

}());
