(function() {

    'use strict';

    var Live = require('../core/Live');
    var Elastic = require('../param/Elastic');
    var Tiling = require('../param/Tiling');
    var TopTerms = require('../agg/TopTerms');
    var Histogram = require('../agg/Histogram');

    var TopCount = Live.extend({

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
