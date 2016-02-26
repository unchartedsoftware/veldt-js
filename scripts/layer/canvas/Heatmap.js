(function() {

    'use strict';
    var Canvas = require('../core/Canvas');
    var Binning = require('../params/Binning');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var Range = require('../params/Range');
    var ColorRamp = require('../mixins/ColorRamp');

    var Heatmap = Canvas.extend({

        includes: [
            Binning,
            TermsFilter,
            PrefixFilter,
            Range,
            ColorRamp
        ],

        type: 'heatmap',

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            // base
            Canvas.prototype.initialize.apply(this, arguments);
        }

    });

    module.exports = Heatmap;

}());
