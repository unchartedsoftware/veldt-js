(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TermsAgg = require('../params/TermsAgg');
    var Range = require('../params/Range');
    var Histogram = require('../params/Histogram');

    var TopicCount = Live.extend({

        includes: [
            // params
            Tiling,
            TermsAgg,
            Range,
            Histogram
        ],

        type: 'topic_count'

    });

    module.exports = TopicCount;

}());
