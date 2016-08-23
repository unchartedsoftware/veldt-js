(function() {

    'use strict';

    var Graph = require('../projection/Graph');

    L.CRS.Graph = L.extend({}, L.CRS, {
        projection: Graph,
        transformation: new L.Transformation(1, 0, 1, 0),

        scale: function(zoom) {
            return Math.pow(2, zoom);
        },

        zoom: function(scale) {
            return Math.log(scale) / Math.LN2;
        },

        distance: function(latlng1, latlng2) {
            var dx = latlng2.lng - latlng1.lng;
            var dy = latlng2.lat - latlng1.lat;

            return Math.sqrt(dx * dx + dy * dy);
        },

        infinite: false
    });

    module.exports = L.CRS.Graph;

}());
