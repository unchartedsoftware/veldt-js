(function() {

    'use strict';

    const Live = require('../core/Live');
    const Elastic = require('../param/Elastic');
    const Tiling = require('../param/Tiling');
    const TermsFilter = require('../agg/TermsFilter');
    const Histogram = require('../agg/Histogram');

    const TopicCount = Live.extend({

        includes: [
            // params
            Elastic,
            Tiling,
            // aggs
            TermsFilter,
            Histogram,
        ],

        type: 'topic_count',

    });

    module.exports = TopicCount;

}());
