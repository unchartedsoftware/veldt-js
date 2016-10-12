(function() {

    'use strict';

    const Live = require('../core/Live');
    const Elastic = require('../param/Elastic');
    const Binning = require('../param/Binning');
    const Terms = require('../agg/Terms');

    const TopTrails = Live.extend({

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
