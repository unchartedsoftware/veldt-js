(function() {

    'use strict';

    var Live = require('../core/Live');
    var Binning = require('../param/Binning');
    var MacroMicro = require('../param/MacroMicro');

    var Macro = Live.extend({

        includes: [
            // params
            Binning,
            MacroMicro
        ],

        type: 'macro',

        extractExtrema: function(data) {
            var bins = new Float64Array(data);
            console.log('derp', bins);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        }

    });

    module.exports = Macro;

}());
