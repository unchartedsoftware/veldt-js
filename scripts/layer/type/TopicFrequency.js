(function() {

    'use strict';

    const Live = require('../core/Live');
    const Elastic = require('../param/Elastic');
    const Tiling = require('../param/Tiling');
    const TermsFilter = require('../agg/TermsFilter');
    const DateHistogram = require('../agg/DateHistogram');
    const Histogram = require('../agg/Histogram');

    const TopicFrequency = Live.extend({

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
