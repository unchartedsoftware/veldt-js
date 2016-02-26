(function() {

    'use strict';

    var HTML = require('../core/HTML');
    var Tiling = require('../params/Tiling');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var TopTerms = require('../params/TopTerms');
    var Range = require('../params/Range');
    var Histogram = require('../params/Histogram');

    var TopCount = HTML.extend({

        includes: [
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
