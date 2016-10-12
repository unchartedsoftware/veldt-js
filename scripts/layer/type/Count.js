(function() {

    'use strict';

    const Live = require('../core/Live');
    const Elastic = require('../param/Elastic');
    const Tiling = require('../param/Tiling');

    const Count = Live.extend({

        includes: [
            // params
            Elastic,
            Tiling
        ],

        type: 'count',

        // extreme not relevant for count tile
        extractExtrema: function() {
            return {
                min: Infinity,
                max: -Infinity
            };
        }
    });

    module.exports = Count;

}());
