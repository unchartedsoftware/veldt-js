(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Tiling = require('../param/Tiling');
    let TopTerms = require('../agg/TopTerms');
    let Histogram = require('../agg/Histogram');
    let TopHits = require('../agg/TopHits');

    let TopCount = Live.extend({

        includes: [
            // params
            Elastic,
            Tiling,
            TopTerms,
            // aggs
            Histogram,
            TopHits
        ],

        type: 'top_count'

    });

    module.exports = TopCount;

}());
