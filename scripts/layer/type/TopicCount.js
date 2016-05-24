(function() {

    'use strict';

    var Live = require('../core/Live');
    var Elastic = require('../param/Elastic');
    var Tiling = require('../param/Tiling');
    var TermsFilter = require('../agg/TermsFilter');
    var Histogram = require('../agg/Histogram');

    var TopicCount = Live.extend({

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
