(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TermsAgg = require('../params/TermsAgg');
    var Range = require('../params/Range');
    var DateHistogram = require('../params/DateHistogram');
    var Histogram = require('../params/Histogram');

    var TopicFrequency = Live.extend({

        includes: [
            // params
            Tiling,
            TermsAgg,
            Range,
            DateHistogram,
            Histogram
        ],

        type: 'topic_frequency'

    });

    module.exports = TopicFrequency;

}());
