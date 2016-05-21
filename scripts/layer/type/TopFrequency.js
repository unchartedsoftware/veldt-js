(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../param/Tiling');
    var TopTerms = require('../agg/TopTerms');
    var DateHistogram = require('../agg/DateHistogram');
    var Histogram = require('../agg/Histogram');
    
    var TopFrequency = Live.extend({

        includes: [
            // params
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
