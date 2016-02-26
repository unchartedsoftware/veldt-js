(function() {

    'use strict';

    var _ = require('lodash');
    var MIN = Number.MAX_VALUE;
    var MAX = 0;

    var clearExtrema = function() {
        this._extrema = {
            min: MIN,
            max: MAX
        };
        this._cache = {};
    };

    var getExtrema = function() {
        return this._extrema;
    };

    var setValueRange = function(range) {
        this._range.min = range.min;
        this._range.max = range.max;
    };

    var getValueRange = function() {
        if (!this._range) {
            return {
                min: this._range.min,
                max: this._range.max
            };
        }
        return this._range;
    };

    var updateExtrema = function(data) {
        var extrema = this.extractExtrema(data);
        var changed = false;
        if (extrema.min < this._extrema.min) {
            changed = true;
            this._extrema.min = extrema.min;
        }
        if (extrema.max > this._extrema.max) {
            changed = true;
            this._extrema.max = extrema.max;
        }
        return changed;
    };

    var extractExtrema = function(data) {
        return {
            min: _.min(data),
            max: _.max(data)
        };
    };

    var transformValue = function(value, type) {
        // extrema range
        var min = this._extrema.min;
        var max = this._extrema.max;
        var clamped = Math.max(Math.min(value, max), min);
        var nval;
        if (type === 'log') {
            var logMin = Math.log10(min || 1);
            var logMax = Math.log10(max || 1);
            var oneOverLogRange = 1 / ((logMax - logMin) || 1);
            nval = (Math.log10(clamped || 1) - logMin) * oneOverLogRange;
        } else {
            var range = max - min;
            nval = (clamped - min) / range;
        }
        var rMin = this._range.min;
        var rMax = this._range.max;
        return (nval - rMin) / (rMax - rMin);
    };

    var setMeta = function(meta) {
        this._meta = meta;
        return this;
    };

    var getMeta = function() {
        return this._meta;
    };

    var setParams = function(params) {
        this._params = params;
    };

    var getParams = function() {
        return this._params;
    };

    var initialize = function(meta) {
        this._meta = meta;
        this._params = {
            binning: {}
        };
        this._range = {
            min: 0,
            max: 1
        };
        this.clearExtrema();
    };

    module.exports = {
        initialize: initialize,
        // meta
        setMeta: setMeta,
        getMeta: getMeta,
        // params
        setParams: setParams,
        getParams: getParams,
        // extrema
        clearExtrema: clearExtrema,
        getExtrema: getExtrema,
        updateExtrema: updateExtrema,
        extractExtrema: extractExtrema,
        // range
        setValueRange: setValueRange,
        getValueRange: getValueRange,
        // transform
        transformValue: transformValue
    };

}());
