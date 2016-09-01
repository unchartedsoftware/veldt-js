(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Tiling = require('../param/Tiling');
    let TermsFilter = require('../agg/TermsFilter');
    let DateHistogram = require('../agg/DateHistogram');
    let Histogram = require('../agg/Histogram');

    let TopicFrequency = Live.extend({

        includes: [
            // params            
            Elastic,
            Tiling,
            // aggs
            TermsFilter,
            DateHistogram,
            Histogram
        ],

        type: 'topic_frequency'

    });

    module.exports = TopicFrequency;

}());
