(function() {

    'use strict';

    const Live = require('../core/Live');
    const Elastic = require('../param/Elastic');
    const Tiling = require('../param/Tiling');
    const TopHits = require('../agg/TopHits');

    const Micro = Live.extend({

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
