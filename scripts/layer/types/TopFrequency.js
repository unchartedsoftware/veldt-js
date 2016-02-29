(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TopTerms = require('../params/TopTerms');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var Range = require('../params/Range');
    var DateHistogram = require('../params/DateHistogram');
    var Histogram = require('../params/Histogram');

    var TopFrequency = Live.extend({

        includes: [
            // params
            Tiling,
            TopTerms,
            TermsFilter,
            PrefixFilter,
            Range,
            DateHistogram,
            Histogram
        ],

        type: 'top_frequency'

    });

    module.exports = TopFrequency;

}());
