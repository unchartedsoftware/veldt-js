(function() {

    'use strict';

    var HTML = require('../core/HTML');
    var Tiling = require('../params/Tiling');
    var TermsAgg = require('../params/TermsAgg');
    var Range = require('../params/Range');
    var Histogram = require('../params/Histogram');

    var TopicCount = HTML.extend({

        includes: [
            Tiling,
            TermsAgg,
            Range,
            Histogram
        ],

        type: 'topic_count'

    });

    module.exports = TopicCount;

}());
