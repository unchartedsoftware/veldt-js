(function() {

    'use strict';

    var Live = require('../core/Live');
    var Binning = require('../param/Binning');
    var TopHits = require('../agg/TopHits');

    var Preview = Live.extend({

        includes: [
            // params
            Binning,
            TopHits 
        ],

        type: 'preview',

        initialize: function() {
            Live.prototype.initialize.apply(this, arguments);
        },

        // extreme not relevant for preview
        extractExtrema: function() {
            return {
                min: 0,
                max: 0
            };
        }
    });

    module.exports = Preview;

}());
