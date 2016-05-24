(function() {

    'use strict';

    var Live = require('../core/Live');
    var Elastic = require('../param/Elastic');
    var Tiling = require('../param/Tiling');
    var TermsFilter = require('../agg/TermsFilter');
    var DateHistogram = require('../agg/DateHistogram');
    var Histogram = require('../agg/Histogram');

    var TopicFrequency = Live.extend({

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
