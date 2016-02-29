(function() {

    'use strict';

    var WebGL = require('../../core/WebGL');

    // TODO:
    //     - update to preceptual color ramps (layer is currently broken)

    var Heatmap = WebGL.extend({

        options: {
            shaders: {
                vert: '../../shaders/heatmap.vert',
                frag: '../../shaders/heatmap.frag',
            }
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
