(function() {

    'use strict';

    var Live = require('../core/Live');
    var Elastic = require('../param/Elastic');
    var Tiling = require('../param/Tiling');
    var TopHits = require('../agg/TopHits');

    var Micro = Live.extend({

        includes: [
            // params
            Elastic,
            Tiling,
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
