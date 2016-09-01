(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Binning = require('../param/Binning');
    let Metric = require('../agg/Metric');

    let Heatmap = Live.extend({

        includes: [
            // params
            Elastic,
            Binning,
            // aggs
            Metric
        ],

        type: 'heatmap',

        extractExtrema: function(data) {
            let bins = new Float64Array(data);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        }

    });

    module.exports = Heatmap;

}());
