(function() {

    'use strict';

    // cartesian projection in (0,0), (256, 256) coordinate space
    L.Projection.Graph = {
        project: function(latlng) {
            return new L.Point(latlng.lng, latlng.lat);
        },

        unproject: function(point) {
            return new L.LatLng(point.y, point.x);
        },

        bounds: L.bounds([0, 0], [256, 256])
    };

    module.exports = L.Projection.Graph;

}());
