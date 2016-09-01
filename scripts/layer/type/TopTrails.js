(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Binning = require('../param/Binning');
    let Terms = require('../agg/Terms');

    let TopTrails = Live.extend({

        includes: [
            // params
            Elastic,
            Binning,
            // aggs
            Terms
        ],

        type: 'top_trails',

        extractExtrema: function() {
            return {
                min: Infinity,
                max: -Infinity
            };
        }

    });

    module.exports = TopTrails;

}());
