(function() {

    'use strict';

    var Live = require('../core/Live');
    var Elastic = require('../param/Elastic');
    var Tiling = require('../param/Tiling');

    var Count = Live.extend({

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
