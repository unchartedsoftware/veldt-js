(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Tiling = require('../param/Tiling');
    let TopTerms = require('../agg/TopTerms');
    let DateHistogram = require('../agg/DateHistogram');
    let Histogram = require('../agg/Histogram');

    let TopFrequency = Live.extend({

        includes: [
            // params
            Elastic,
            Tiling,
            // aggs
            TopTerms,
            DateHistogram,
            Histogram
        ],

        type: 'top_frequency',

    });

    module.exports = TopFrequency;

}());
