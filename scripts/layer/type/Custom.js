(function() {

    'use strict';

    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Tiling = require('../param/Tiling');
    let CustomAggs = require('../agg/CustomAggs');

    let Custom = Live.extend({

        includes: [
            // params
            Elastic,
            Tiling,
            // aggs
            CustomAggs
        ],

        type: 'custom_tile'

    });

    module.exports = Custom;

}());
