(function() {

    'use strict';

    const Live = require('../core/Live');
    const Elastic = require('../param/Elastic');
    const Binning = require('../param/Binning');

    const Macro = Live.extend({

        includes: [
            // params
            Elastic,
            Binning
        ],

        type: 'macro',

        extractExtrema: function(data) {
            const bins = new Float64Array(data);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        }

    });

    module.exports = Macro;

}());
