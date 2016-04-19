(function() {

    'use strict';

    var Live = require('../core/Live');
    var Binning = require('../params/Binning');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var Range = require('../params/Range');
    var QueryString = require('../params/QueryString');

    var Preview = Live.extend({

        includes: [
            // params
            Binning,
            TermsFilter,
            PrefixFilter,
            Range,
            QueryString,
        ],

        type: 'preview',

        initialize: function() {
            Live.prototype.initialize.apply(this, arguments);
        }
    });

    module.exports = Preview;

}());
