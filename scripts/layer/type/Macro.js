(function() {

    'use strict';

    var Live = require('../core/Live');
    var Elastic = require('../param/Elastic');
    var Binning = require('../param/Binning');

    var Macro = Live.extend({

        includes: [
            // params
            Elastic,
            Binning
        ],

        type: 'macro',

        extractExtrema: function(data) {
            var bins = new Float64Array(data);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        }

    });

    module.exports = Macro;

}());
