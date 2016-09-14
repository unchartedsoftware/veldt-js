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
            if (!data) {
                console.log('fuck you');
                return {
                    min: Infinity,
                    max: -Infinity
                };
            }

            return {
                min: _.minBy(data, community => {
                    console.log(community);
                    return Infinity; //community.numNodes ? community.numNodes : Infinity;
                }).numNodes,
                max: _.maxBy(data, community => {
                    console.log(community);
                    return -Infinity; //community.numNodes ? community.numNodes : -Infinity;
                }).numNodes
            };
        }
    });

    module.exports = Community;

}());
