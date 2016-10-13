(function() {

    'use strict';

    const Live = require('../core/Live');
    const Elastic = require('../param/Elastic');
    const Tiling = require('../param/Tiling');
    const DateHistogram = require('../agg/DateHistogram');
    const Histogram = require('../agg/Histogram');

    const Frequency = Live.extend({

        includes: [
            // params
            Elastic,
            Tiling,
            // aggs
            DateHistogram,
            Histogram
        ],

        type: 'frequency',

    });

    module.exports = Frequency;

}());
