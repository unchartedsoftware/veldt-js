(function() {

    'use strict';

    const Live = require('../core/Live');
    const Elastic = require('../param/Elastic');
    const Tiling = require('../param/Tiling');
    const TopTerms = require('../agg/TopTerms');
    const DateHistogram = require('../agg/DateHistogram');
    const Histogram = require('../agg/Histogram');
    const TopHits = require('../agg/TopHits');

    const TopFrequency = Live.extend({

        includes: [
            // params
            Elastic,
            Tiling,
            // aggs
            TopTerms,
            DateHistogram,
            Histogram,
            TopHits
        ],

        type: 'top_frequency',

    });

    module.exports = TopFrequency;

}());
