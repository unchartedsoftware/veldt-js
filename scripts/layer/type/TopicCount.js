(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Tiling = require('../param/Tiling');
    let TermsFilter = require('../agg/TermsFilter');
    let Histogram = require('../agg/Histogram');

    let TopicCount = Live.extend({

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
