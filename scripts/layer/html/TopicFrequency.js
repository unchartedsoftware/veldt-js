(function() {

    'use strict';

    var HTML = require('../core/HTML');
    var Tiling = require('../params/Tiling');
    var TermsAgg = require('../params/TermsAgg');
    var Range = require('../params/Range');
    var DateHistogram = require('../params/DateHistogram');
    var Histogram = require('../params/Histogram');

    var TopicFrequency = HTML.extend({

        includes: [
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
