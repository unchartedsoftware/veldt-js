(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Tiling = require('../param/Tiling');

    let Count = Live.extend({

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
