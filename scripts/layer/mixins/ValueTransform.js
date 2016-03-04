(function() {

    'use strict';

    function log10Transform(val, min, max) {
        var logMin = Math.log10(min || 1);
        var logMax = Math.log10(max || 1);
        var logVal = Math.log10(val || 1);
        var oneOverLogRange = 1 / ((logMax - logMin) || 1);
        return (logVal - logMin) * oneOverLogRange;
    }

    function sigmoidTransform(val, min, max) {
        var scale = 0.15;
        var distance = Math.max(Math.abs(min), Math.abs(max));
        var scaledVal = val / (scale * distance);
        return 1 / (1 + Math.exp(-scaledVal));
    }

    function linearTransform(val, min, max) {
        var range = max - min;
        return (val - min) / range;
    }

    var Transform = {
        linear: linearTransform,
        log10: log10Transform,
        sigmoid: sigmoidTransform
    };

    var initialize = function() {
        this._range = {
            min: 0,
            max: 1
        };
        this._transformFunc = log10Transform;
    };

    var setTransformFunc = function(type) {
        var func = Transform[type.toLowerCase()];
        this._transformFunc = func;
    };

    var getTransformFunc = function() {
        if (!this._range) {
            return {
                min: this._range.min,
                max: this._range.max
            };
        }
        return this._range;
    };

    var setValueRange = function(range) {
        this._range.min = range.min;
        this._range.max = range.max;
    };

    var getValueRange = function() {
        return this._range;
    };

    var transformValue = function(value) {
        // clamp the value between the extreme (shouldn't be necessary)
        var min = this._extrema.min;
        var max = this._extrema.max;
        var clamped = Math.max(Math.min(value, max), min);
        // normalize the value
        var nval = this._transformFunc(clamped, min, max);
        // interpolate between the filter range
        var rMin = this._range.min;
        var rMax = this._range.max;
        var rval = (nval - rMin) / (rMax - rMin);
        // ensure output is [0:1]
        return Math.max(0, Math.min(1, rval));
    };

    module.exports = {
        initialize: initialize,
        setTransformFunc: setTransformFunc,
        getTransformFunc: getTransformFunc,
        setValueRange: setValueRange,
        getValueRange: getValueRange,
        transformValue: transformValue
    };

}());
