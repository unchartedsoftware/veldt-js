(function() {

    'use strict';

    var _ = require('lodash');
    var WebGL = require('../core/WebGL');
    var Binning = require('../params/Binning');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var Range = require('../params/Range');
    var ColorRamp = require('../mixins/ColorRamp');

    // TODO:
    //     - update to preceptual color ramps (layer is currently broken)

    var Heatmap = WebGL.extend({

        includes: [
            Binning,
            TermsFilter,
            PrefixFilter,
            Range,
            ColorRamp
        ],

        type: 'heatmap',

        options: {
            shaders: {
                vert: '../../shaders/heatmap.vert',
                frag: '../../shaders/heatmap.frag',
            }
        },

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            // base
            WebGL.prototype.initialize.apply(this, arguments);
        },

        extractExtrema: function(data) {
            var bins = new Float64Array(data);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        },

        beforeDraw: function() {
            var ramp = this.getColorRamp();
            var color = [0, 0, 0, 0];
            this._shader.setUniform('uMin', this.getExtrema().min);
            this._shader.setUniform('uMax', this.getExtrema().max);
            this._shader.setUniform('uColorRampFrom', ramp(0.0, color));
            this._shader.setUniform('uColorRampTo', ramp(1.0, color));
        }

    });

    module.exports = Heatmap;

}());
