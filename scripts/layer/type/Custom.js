(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Tiling = require('../param/Tiling');

    let Custom = Live.extend({

        includes: [
            // params
            Elastic,
            Tiling
        ],

        type: 'custom_tile',

        setCustomQuery: function(source) {
            this._params.source = source;
        }

    });

    module.exports = Custom;

}());
