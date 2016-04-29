(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../param/Tiling');
    var TermsFilter = require('../agg/TermsFilter');
    var DateHistogram = require('../agg/DateHistogram');
    var Histogram = require('../agg/Histogram');
    var ValueTransform = require('../mixin/ValueTransform');

    var TopicFrequency = Live.extend({

        includes: [
            // params
            Tiling,
            TermsFilter,
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
