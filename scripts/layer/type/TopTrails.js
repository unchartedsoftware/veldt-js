(function() {

    'use strict';

    var Live = require('../core/Live');
    var Binning = require('../param/Binning');
    var Terms = require('../agg/Terms');
    var ColorRamp = require('../mixin/ColorRamp');
    var ValueTransform = require('../mixin/ValueTransform');

    var TopTrails = Live.extend({

        includes: [
            // params
            Binning,
            // aggs
            Terms,
            // mixins
            ColorRamp,
            ValueTransform
        ],

        type: 'top_trails',

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

        extractExtrema: function() {
            return [ 0, 0 ];
        }

    });

    module.exports = TopTrails;

}());
