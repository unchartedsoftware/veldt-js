(function() {

    'use strict';

    var Live = require('./Live');
    var async = require('async');

    var Composite = Live.extend({

        initialize: function(meta, options) {
            // set layers
            if (!options.layers) {
                throw 'No `layers` option found.';
            } else {
                this.layers = options.layers;
                delete options.layers;
            }
            // set combine function
            if (!options.combine) {
                throw 'No `combine` option found.';
            } else {
                this.combine = options.combine;
                delete options.combine;
            }
            Live.prototype.initialize.apply(this, arguments);
        },

        requestTile: function(coords, done) {
            var requests = {};
            _.forIn(this.layers, function(layer, key) {
                requests[key] = function(done) {
                    layer.requestTile(coords, function(res) {
                        done(null, res);
                    });
                };
            });
            var self = this;
            // request all the tiles in parallel
            async.parallel(requests, function(err, results) {
                if (err !== null) {
                    done(null);
                    return;
                }
                // combine them here
                done(self.combine(results));
            });
        },

        extractExtrema: function() {
            return {
                min: Infinity,
                max: -Infinity
            };
        }

    });

    module.exports = Composite;

}());
