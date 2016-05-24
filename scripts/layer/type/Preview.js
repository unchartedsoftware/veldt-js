(function() {

    'use strict';

    var Live = require('../core/Live');
    var Elastic = require('../param/Elastic');
    var Binning = require('../param/Binning');
    var TopHits = require('../agg/TopHits');

    var Preview = Live.extend({

        includes: [
            // params
            Elastic,
            Binning,
            // aggs
            TopHits
        ],

        type: 'preview',

        // extreme not relevant for preview
        extractExtrema: function() {
            return {
                min: Infinity,
                max: -Infinity
            };
        }
    });

    module.exports = Preview;

}());
