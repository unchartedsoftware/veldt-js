(function() {

    'use strict';

    let SIGMOID_SCALE = 0.15;

    // log10

    function log10Transform(val, min, max) {
        let logMin = Math.log10(min || 1);
        let logMax = Math.log10(max || 1);
        let logVal = Math.log10(val || 1);
        return (logVal - logMin) / ((logMax - logMin) || 1);
    }

    function inverseLog10Transform(nval, min, max) {
        let logMin = Math.log10(min || 1);
        let logMax = Math.log10(max || 1);
        return Math.pow(10, (nval * logMax - nval * logMin) + logMin);
    }

    // sigmoid

    function sigmoidTransform(val, min, max) {
        let absMin = Math.abs(min);
        let absMax = Math.abs(max);
        let distance = Math.max(absMin, absMax);
        let scaledVal = val / (SIGMOID_SCALE * distance);
        return 1 / (1 + Math.exp(-scaledVal));
    }

    function inverseSigmoidTransform(nval, min, max) {
        let absMin = Math.abs(min);
        let absMax = Math.abs(max);
        let distance = Math.max(absMin, absMax);
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
        let range = max - min;
        if (range === 0) {
            return 1;
        }
        return (val - min) / range;
    }

    function inverseLinearTransform(nval, min, max) {
        let range = max - min;
        if (range === 0) {
            return 1;
        }
        return min + nval * range;
    }

    let Transform = {
        linear: linearTransform,
        log10: log10Transform,
        sigmoid: sigmoidTransform
    };

    let Inverse = {
        linear: inverseLinearTransform,
        log10: inverseLog10Transform,
        sigmoid: inverseSigmoidTransform
    };

    let initialize = function() {
        this._range = {
            min: 0,
            max: 1
        };
        this._transformFunc = log10Transform;
        this._inverseFunc = inverseLog10Transform;
    };

    let setTransformFunc = function(type) {
        let func = type.toLowerCase();
        this._transformFunc = Transform[func];
        this._transformType = type;
        this._inverseFunc = Inverse[func];
    };

    let setValueRange = function(range) {
        this._range.min = range.min;
        this._range.max = range.max;
    };

    let getValueRange = function() {
        return this._range;
    };

    let getTransformEnum = function() {
        if (this._transformType === 'linear') {
            return 1;
        } else if (this._transformType === 'sigmoid') {
            return 2;
        }
        return 0;
    };

    let interpolateToRange = function(nval) {
        // interpolate between the filter range
        let rMin = this._range.min;
        let rMax = this._range.max;
        let rval = (nval - rMin) / (rMax - rMin);
        // ensure output is [0:1]
        return Math.max(0, Math.min(1, rval));
    };

    let transformValue = function(val) {
        // clamp the value between the extreme (shouldn't be necessary)
        let min = this._extrema.min;
        let max = this._extrema.max;
        let clamped = Math.max(Math.min(val, max), min);
        // normalize the value
        if (min !== max) {
            return this._transformFunc(clamped, min, max);
        }
        // if min === max, always return 1
        return 1;
    };

    let untransformValue = function(nval) {
        let min = this._extrema.min;
        let max = this._extrema.max;
        // clamp the value between the extreme (shouldn't be necessary)
        let clamped = Math.max(Math.min(nval, 1), 0);
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
