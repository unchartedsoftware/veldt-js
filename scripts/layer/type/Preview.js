(function() {

    'use strict';

    const Live = require('../core/Live');
    const Elastic = require('../param/Elastic');
    const Binning = require('../param/Binning');
    const TopHits = require('../agg/TopHits');

    const Preview = Live.extend({

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
