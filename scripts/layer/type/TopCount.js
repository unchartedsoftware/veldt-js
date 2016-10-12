(function() {

    'use strict';

    const Live = require('../core/Live');
    const Elastic = require('../param/Elastic');
    const Tiling = require('../param/Tiling');
    const TopTerms = require('../agg/TopTerms');
    const Histogram = require('../agg/Histogram');
    const TopHits = require('../agg/TopHits');

    const TopCount = Live.extend({

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
