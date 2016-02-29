(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var TopTerms = require('../params/TopTerms');
    var Range = require('../params/Range');
    var Histogram = require('../params/Histogram');

    var TopCount = Live.extend({

        includes: [
            // params
            Tiling,
            TopTerms,
            TermsFilter,
            PrefixFilter,
            Range,
            Histogram
        ],

        type: 'top_count'

    });

    module.exports = TopCount;

}());
