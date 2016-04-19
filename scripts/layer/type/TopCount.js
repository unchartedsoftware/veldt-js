(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../param/Tiling');
    var TopTerms = require('../agg/TopTerms');
    var Histogram = require('../agg/Histogram');
    var ValueTransform = require('../mixin/ValueTransform');

    var TopCount = Live.extend({

        includes: [
            // params
            Tiling,
            TopTerms,
            // aggs
            Histogram,
            // mixins
            ValueTransform
        ],

        type: 'top_count',

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

    });

    module.exports = TopCount;

}());
