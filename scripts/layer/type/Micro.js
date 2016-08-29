(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Tiling = require('../param/Tiling');
    let TopHits = require('../agg/TopHits');

    let Micro = Live.extend({

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
