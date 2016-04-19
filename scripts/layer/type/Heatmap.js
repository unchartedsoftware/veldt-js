(function() {

    'use strict';

    var Live = require('../core/Live');
    var Binning = require('../param/Binning');
    var Metric = require('../agg/Metric');
    var ColorRamp = require('../mixin/ColorRamp');
    var ValueTransform = require('../mixin/ValueTransform');

    var Heatmap = Live.extend({

        includes: [
            // params
            Binning,
            // aggs
            Metric,
            // mixins
            ColorRamp,
            ValueTransform
        ],

        type: 'heatmap',

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

        extractExtrema: function(data) {
            var bins = new Float64Array(data);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        }

    });

    module.exports = Heatmap;

}());
