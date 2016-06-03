// Draws spatially located bin data as a SVG dots on a map.  Currently piggy-backs on
// the canvas-based tile layer to take advantage of tile fetch and update logic, but
// should be reworked to use some type of a base layer that uses tiles as underlying data,
// but doesn't require (unused) DOM elements to be created.
(function() {

    'use strict';

    var Overlay = require('../../core/Overlay');
    var moment = require('moment');

    var PointsOfInterest = Overlay.extend({
        // used to store a list of markers for each tile, where the tiles
        // x/y/z indices are used as the key
        _markers: {},

        onRemove: function(map) {
            Overlay.prototype.onRemove.call(this, map);
            var self = this;
            _.forEach(self._markers, function(markers) {
                 _.forEach(markers, function(marker) {
                    map.removeLayer(marker);
                });
            });
            self._markers = {};
        },

        options: {
            handlers: {},
            lineWidth: 0,
            poiOpacity: 0.5,
            poiHighlightOpacity: 1.0,
            poiLineWidth: 1,
            poiLineColor: '#ffffff',
            poiFillColor: '#ffffff',
            poiHighlightColor: '#ff0000',
            poiSize: 4,
            // force out of view tiles to be unload so that they're associated
            // marker can be removed
            unloadInvisibleTiles: true
        },

        onCacheLoad: function(tile, cached, coord) {
            var self = this;
            var key = self.cacheKeyFromCoord(coord);

            // store the markers for the tile so that we can remove them when the tile
            // is no longer visible
            if (!self._markers[key]) {
                self._markers[key] = [];

                var fieldDataToLatLon = self._createFieldDataConverter(
                    self.getXField(), self.getYField(), self._meta, coord.z);

                // Create a marker for non-null bin in our data and register handlers
                // to look after mouse events.  We can have mutiple tiles associated
                // with a single key since the world wraps, so we ensure that we only
                // add markers once for a key.
                _.forEach(cached.data, function(d) {
                    if (d) {
                        // tx the point in our data space into a lat/lon point that the
                        // Leaflet marker API can consume.  If the point can't be transformed
                        // we skip it.
                        var latLon = fieldDataToLatLon(d[0]);
                        if (latLon === null) {
                            return false;
                        }

                        var circle = L.circleMarker(latLon, {
                            radius: self.options.poiSize / 2,
                            color: self.options.poiLineColor,
                            opacity: self.options.poiOpacity,
                            fillColor: self.options.poiFillColor,
                            fillOpacity: self.options.poiOpacity
                        }).addTo(self._map);

                        // register mouse event handlers for the circle
                        circle.on('click', function(e) {
                            self._click(circle, d, e);
                        });

                        circle.on('mouseover', function(e) {
                            self._mouseOver(circle, d, e);
                        });

                        circle.on('mouseout', function(e) {
                            self._mouseOut(circle, d, e);
                        });
                        // add the marker to the tracked list for the layer so that we can
                        // remove it from the map when its associated tile is no longer
                        // visible.
                        self._markers[key].push(circle);
                    }
                });
            }
        },

        onCacheUnload: function(tile, cached, coord) {
            // Remove markers associated with the unloaded tile tricky bit here is that
            // when we zoom out the world wraps, so we'll actually have multiple tiles mapped
            // to the same key.  We therefore don't delete the points until wed have no
            // cache entry (meaning no tiles at all) for a given key.
            var self = this;
            var key = self.cacheKeyFromCoord(coord);
            _.forEach(self._markers[key], function(marker) {
                self._map.removeLayer(marker);
            });
            delete self._markers[key];
        },

        _click: function(circle, data, e) {
            var target = $(e.originalEvent.target);
            var layerPoint = this._getLayerPointFromLonLat(e.latlng);
            var binCoord = this.getBinCoordFromLayerPoint(layerPoint);
            var tileCoord = this.getTileCoordFromLayerPoint(layerPoint);
            if (this.options.handlers.click) {
                this.options.handlers.click(target, {
                    value: data,
                    x: tileCoord.x,
                    y: tileCoord.z,
                    z: tileCoord.z,
                    bx: binCoord.x,
                    by: binCoord.y,
                    type: 'pointsOfInterest',
                    layer: this
                });
            }
        },

        _mouseOver: function(circle, data, e) {
            // render a highlight visual and pass event data to downstream
            // listeners
            var target = $(e.originalEvent.target);

            circle.setStyle({
                radius: this.options.poiSize + 2,
                color: this.options.poiHighlightColor,
                opacity: this.poiHighlightOpacity,
                fillOpacity: 0.0
            });

            var layerPoint = this._getLayerPointFromLonLat(e.latlng);
            var binCoord = this.getBinCoordFromLayerPoint(layerPoint);
            var tileCoord = this.getTileCoordFromLayerPoint(layerPoint);

            if (this.options.handlers.mouseover) {
                this.options.handlers.mouseover(target, {
                    value: data,
                    x: tileCoord.x,
                    y: tileCoord.z,
                    z: tileCoord.z,
                    bx: binCoord.x,
                    by: binCoord.y,
                    type: 'pointsOfInterest',
                    layer: this
                });
            }
        },

        _mouseOut: function(circle, data, e) {
            // remove the highlight styling and pass event data to downstream
            // listeners
            var target = $(e.originalEvent.target);

            circle.setStyle({
                radius: this.options.poiSize / 2,
                color: this.options.poiLineColor,
                opacity: this.options.poiOpacity,
                fillColor: this.options.poiFillColor,
                fillOpacity: this.options.poiOpacity
            });

            var layerPoint = this._getLayerPointFromLonLat(e.latlng);
            var binCoord = this.getBinCoordFromLayerPoint(layerPoint);
            var tileCoord = this.getTileCoordFromLayerPoint(layerPoint);

            if (this.options.handlers.mouseout) {
                this.options.handlers.mouseout(target, {
                    value: null,
                    x: tileCoord.x,
                    y: tileCoord.z,
                    z: tileCoord.z,
                    bx: binCoord.x,
                    by: binCoord.y,
                    type: 'pointsOfInterest',
                    layer: this
                });
            }
        },

        _createFieldDataConverter: function(xField, yField, meta, zoom) {
            var self = this;
            // generates a function extracts a numeric value or a formatted date string
            function createExtractor(field) {
                var type = _.get(meta, field).type;
                if (type === 'long' || type === 'integer' || type === 'float' ||
                    type === 'double' || type === 'short' || type === 'byte') {
                    return function(data) { return _.get(data, field); };
                } else if (type === 'date') {
                    return function(data) { return moment(_.get(data, field)); };
                } else {
                    console.error('Unhandled field data type ' + type);
                    return null;
                }
            }
            // create extraction functions for each of the fields
            var xExtractor = createExtractor(xField);
            var yExtractor = createExtractor(yField);
            // create the final function to extract x,y values from data and convert them into
            // lat/lon coordintes.
            if (xExtractor === null || yExtractor === null) {
                return function() { return null; };
            } else {
                return function(data) {
                    var x = xExtractor(data);
                    var y = yExtractor(data);
                    var layerPoint = self.getLayerPointFromDataPoint(x, y, zoom);
                    return self._map.unproject(L.point(layerPoint.x, layerPoint.y));
                };
            }
        }
    });

    module.exports = PointsOfInterest;

}());
