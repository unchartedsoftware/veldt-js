(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Tiling = require('../param/Tiling');
    let TopTerms = require('../agg/TopTerms');
    let Histogram = require('../agg/Histogram');

    let TopCount = Live.extend({

        includes: [
            // params
            Elastic,
            Tiling,
            TopTerms,
            // aggs
            Histogram
        ],

        type: 'top_count'

    });

    module.exports = TopCount;

}());
