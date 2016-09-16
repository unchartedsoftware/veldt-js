(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Binning = require('../param/Binning');

    let Macro = Live.extend({

        includes: [
            // params
            Elastic,
            Binning
        ],

        type: 'macro',

        extractExtrema: function(data) {
            let bins = new Float64Array(data);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        }

    });

    module.exports = Macro;

}());
