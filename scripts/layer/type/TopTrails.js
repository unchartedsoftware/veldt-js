(function() {

    'use strict';

    var Live = require('../core/Live');
    var Elastic = require('../param/Elastic');
    var Binning = require('../param/Binning');
    var Terms = require('../agg/Terms');

    var TopTrails = Live.extend({

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
