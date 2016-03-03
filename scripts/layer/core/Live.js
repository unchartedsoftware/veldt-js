(function() {

    'use strict';

    var $ = require('jquery');
    var _ = require('lodash');
    var L = require('leaflet');
    var MIN = Number.MAX_VALUE;
    var MAX = 0;

    var Live = L.Class.extend({

        initialize: function(meta, options) {
            // set renderer
            if (!options.rendererClass) {
                console.warn('No `rendererClass` option found, this layer will not render any data.');
            } else {
                // recursively extend and initialize
                if (options.rendererClass.prototype) {
                    $.extend(true, this, options.rendererClass.prototype);
                    options.rendererClass.prototype.initialize.apply(this, arguments);
                } else {
                    $.extend(true, this, options.rendererClass);
                    options.rendererClass.initialize.apply(this, arguments);
                }
            }
            // set options
            L.setOptions(this, options);
            // set meta
            this._meta = meta;
            // set params
            this._params = {
                binning: {}
            };
            this._range = {
                min: 0,
                max: 1
            };
            this.clearExtrema();
        },

        clearExtrema: function() {
            this._extrema = {
                min: MIN,
                max: MAX
            };
            this._cache = {};
        },

        getExtrema: function() {
            return this._extrema;
        },

        setValueRange: function(range) {
            this._range.min = range.min;
            this._range.max = range.max;
        },

        getValueRange: function() {
            if (!this._range) {
                return {
                    min: this._range.min,
                    max: this._range.max
                };
            }
            return this._range;
        },

        updateExtrema: function(data) {
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
        },

        extractExtrema: function(data) {
            return {
                min: _.min(data),
                max: _.max(data)
            };
        },

        transformValue: function(value, type) {
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
        },

        setMeta: function(meta) {
            this._meta = meta;
            return this;
        },

        getMeta: function() {
            return this._meta;
        },

        setParams: function(params) {
            this._params = params;
        },

        getParams: function() {
            return this._params;
        }

    });

    module.exports = Live;

}());
