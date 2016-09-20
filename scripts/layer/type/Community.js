(function() {

    'use strict';

    let _ = require('lodash');
    let Live = require('../core/Live');
    let Elastic = require('../param/Elastic');
    let Tiling = require('../param/Tiling');
    let TopHits = require('../agg/TopHits');

    let Community =  Live.extend({

        includes: [
            // params
            Elastic,
            Tiling,
            // aggs
            TopHits
        ],

        type: 'micro',

        // extreme not relevant for micro
        extractExtrema: function(data) {
            if (!data || data.length === 0) {
                return {
                    min: Infinity,
                    max: -Infinity
                };
            }
            return {
                min: _.minBy(data, community => {
                    return community.degree;
                }).degree,
                max: _.maxBy(data, community => {
                    return community.degree;
                }).degree
            };
        }
    });

    module.exports = Community;

}());
