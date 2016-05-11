// Draws spatially located bin data as a SVG dots on a map.  Currently piggy-backs on
// the canvas-based tile layer to take advantage of tile fetch and update logic, but
// should be reworked to use some type of a base layer that uses tiles as underlying data,
// but doesn't require (unused) DOM elements to be created.
(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');

    var PointsOfInterest = Canvas.extend({
        // used to store a list of markers for each tile, where the tiles
        // x/y/z indices are used as the key 
        _markers: {},

        onAdd: function(map) {
            Canvas.prototype.onAdd.call(this, map);
            // register for tile load and unload notifications so that markers
            // can be added and removed from the map as their associated tiles
            // are swapped in and out.
            this.on('tileload', this._tileLoad);
            this.on('tileunload', this._tileUnload);
        },

        options: {
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
       
        _tileLoad: function(e) {
            var self = this;
            var key = self._cacheKeyFromCoord(e.tile._tilePoint);
            var cached = self._cache[key];
            if (!cached) {
                console.error('No cached data found for key ' + key);
                return;
            }

            // store the markers for the tile so that we can remove them when the tile
            // is no longer visible
            if (!self._markers[key]) {
                self._markers[key] = [];
                // Create a marker for non-null bin in our data and register handlers
                // to look after mouse events.  We can have mutiple tiles associated
                // with a single key since the world wraps, so we ensure that we only
                // add markers once for a key.
                _.forEach(cached.data, function(d) {
                    if (d) {
                        var circle = L.circleMarker([d[0].location.lat, d[0].location.lon], {
                            radius: self.options.poiSize / 2,
                            color: self.options.poiLineColor,
                            fillColor: self.options.poiFillColor,
                            fillOpacity: self.options.poiOpacity 
                        }).addTo(self._map);

                        // register mouse event handlers for the circle 
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

        _tileUnload: function(e) {
            // Remove markers associated with the unloaded tile tricky bit here is that 
            // when we zoom out the world wraps, so we'll actually have multiple tiles mapped
            // to the same key.  We therefore don't delete the points until wed have no
            // cache entry (meaning no tiles at all) for a given key.
            var self = this;
            var key = self._cacheKeyFromCoord(e.tile._tilePoint);
            var cached = self._cache[key];
            if (!cached) {
                _.forEach(self._markers[key], function(marker) {
                    self._map.removeLayer(marker);
                });
                delete self._markers[key];
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
            var binCoord = this._getBinCoordFromLayerPoint(layerPoint);
            var tileCoord = this._getTileCoordFromLayerPoint(layerPoint);
            
            if (this.options.handlers.mousemove) {
                this.options.handlers.mousemove(target, {
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
            var binCoord = this._getBinCoordFromLayerPoint(layerPoint);
            var tileCoord = this._getTileCoordFromLayerPoint(layerPoint);
            
            if (this.options.handlers.mousemove) {
                this.options.handlers.mousemove(target, {
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
    });

    module.exports = PointsOfInterest;

}());
