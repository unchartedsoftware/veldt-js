(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../param/Tiling');
    var MacroMicro = require('../param/MacroMicro');
    var TopHits = require('../agg/TopHits');

    var Micro = Live.extend({

        includes: [
            // params
            Tiling,
            MacroMicro,
            // aggs
            TopHits
        ],

        type: 'micro',

        // extreme not relevant for micro
        extractExtrema: function() {
            return {
                min: Infinity,
                max: -Infinity
            };
        }
    });

    module.exports = Micro;

}());
