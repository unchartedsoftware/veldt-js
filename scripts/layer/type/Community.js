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

        options: {
            degreeField: 'properties.degree'
        },

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
                min: _.get(_.minBy(data, community => {
                    return _.get(community, this.options.degreeField);
                }), this.options.degreeField),
                max: _.get(_.maxBy(data, community => {
                    return _.get(community, this.options.degreeField);
                }), this.options.degreeField)
            };
        }
    });

    module.exports = Community;

}());
