(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Tiling = require('../param/Tiling');
    let DateHistogram = require('../agg/DateHistogram');
    let Histogram = require('../agg/Histogram');

    let Frequency = Live.extend({

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
