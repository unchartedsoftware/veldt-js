(function() {

    'use strict';

    var Live = require('../core/Live');
    var Elastic = require('../param/Elastic');
    var Binning = require('../param/Binning');
    var Metric = require('../agg/Metric');

    var Heatmap = Live.extend({

        includes: [
            // params
            Elastic,
            Binning,
            // aggs
            Metric
        ],

        type: 'heatmap',

        extractExtrema: function(data) {
            var bins = new Float64Array(data);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        }

    });

    module.exports = Heatmap;

}());
