(function() {

    'use strict';

    const Live = require('../core/Live');
    const Elastic = require('../param/Elastic');
    const Binning = require('../param/Binning');
    const Metric = require('../agg/Metric');

    const Heatmap = Live.extend({

        includes: [
            // params
            Elastic,
            Binning,
            // aggs
            Metric
        ],

        type: 'heatmap',

        extractExtrema: function(data) {
            const bins = new Float64Array(data);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        }

    });

    module.exports = Heatmap;

}());
