(function() {

    'use strict';

    var _ = require('lodash');
    var Live = require('../core/Live');
    var Binning = require('../params/Binning');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var Range = require('../params/Range');
    var ColorRamp = require('../mixins/ColorRamp');

    var Heatmap = Live.extend({

        includes: [
            // params
            Binning,
            TermsFilter,
            PrefixFilter,
            Range,
            // mixins
            ColorRamp
        ],

        type: 'heatmap',

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
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
