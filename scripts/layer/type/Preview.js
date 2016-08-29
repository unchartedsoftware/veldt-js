(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Binning = require('../param/Binning');
    let TopHits = require('../agg/TopHits');

    let Preview = Live.extend({

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
