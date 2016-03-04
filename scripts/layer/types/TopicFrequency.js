(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TermsAgg = require('../params/TermsAgg');
    var Range = require('../params/Range');
    var DateHistogram = require('../params/DateHistogram');
    var Histogram = require('../params/Histogram');
    var ValueTransform = require('../mixins/ValueTransform');

    var TopicFrequency = Live.extend({

        includes: [
            // params
            Tiling,
            TermsAgg,
            Range,
            DateHistogram,
            Histogram,
            // mixins
            ValueTransform
        ],

        type: 'topic_frequency',

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

    });

    module.exports = TopicFrequency;

}());
