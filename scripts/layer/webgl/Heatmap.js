(function() {

    'use strict';

    var WebGL = require('../core/WebGL');
    var Binning = require('../params/Binning');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var Range = require('../params/Range');
    var ColorRamp = require('../mixins/ColorRamp');

    var Heatmap = WebGL.extend({

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
            WebGL.prototype.initialize.apply(this, arguments);
        }

    });

    module.exports = Heatmap;

}());
