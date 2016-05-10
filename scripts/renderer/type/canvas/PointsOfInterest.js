(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');

    var PointsOfInterest = Canvas.extend({

        options: {
            lineWidth: 0,
            poiLineWidth: 1,
            poiLineColor: 'white',
            poiFillColor: null,
            poiSize: 6,
        },
        
        // renders a canvas-based tile such that the points identified in the
        // data parameter are displayed as a dot on the map. 
        renderTile: function(canvas, data, coord) {
                        
            var key = this._cacheKeyFromCoord(coord);
            var cached = this._cache[key];
            if (!cached) {
                console.error('No cached data found for key ' + key);
                return;
            }

            if (!data) {
                console.error('No tile data available for key ' + key);
            }
            
            var ctx = canvas.getContext('2d');

            var poiSize = this.options.poiSize;
            var self = this;

            _.forEach(data, function(d) {
                if (d) {
                    // convert geo point into bin coord.  We peg the bin size to 1 so that 
                    // we get pixel level precision
                    var layerPoint = self._getLayerPointFromLonLat(d[0].location);
                    var binCoord = self._getBinCoordFromLayerPoint(layerPoint, 
                                                                   self.options.tileSize);

                    // calculate hit boxes for the points if this is the first time
                    // we're rendering
                    if (!cached.hitBoxes) {
                        cached.hitBoxes = [];
                    }
                    cached.hitBoxes.push({
                        x: binCoord.x - poiSize/2,
                        y: binCoord.y - poiSize/2,
                        w: poiSize,
                        h: poiSize
                    });
                    
                    /*var circle = L.circle([d[0].location.lat, d[0].location.lon], 500, {
                        color: poiLineColor,
                        fillColor: poiFillColor,
                        fillOpacity: 0.5 
                    }).addTo(self._map);*/

                    // draw the points of interest
                    ctx.beginPath();
                    ctx.arc(
                        binCoord.x,
                        binCoord.y,
                        poiSize/2,
                        0,
                        2 * Math.PI,
                        false);
                    if (self.options.fillColor) {
                        ctx.fillStyle = self.options.poiFillColor;
                        ctx.fill();
                    }    
                    if (self.options.poiLineWidth > 0) {
                        ctx.lineWidth = self.options.poiLineWidth;
                        ctx.strokeStyle = self.options.poiLineColor;
                        ctx.stroke();
                    }
                }
            });
        },

        _renderHighlight: function(canvas, location) {
            var ctx = canvas.getContext('2d');

            var poiSize = 4;
            var self = this;

            ctx.beginPath();
            ctx.fillStyle = self.options.poiFillColor;
            ctx.arc(
                location.x,
                location.y,
                poiSize,
                0,
                2 * Math.PI,
                false);
            ctx.fill();
            ctx.lineWidth = self.options.poiLineWidth;
            ctx.strokeStyle = self.options.poiLineColor;
            ctx.stroke();
        },

        onMouseMove: function(e) {
            var target = $(e.originalEvent.target);

            var layerPoint = this._getLayerPointFromEvent(e);
            var coord = this._getTileCoordFromLayerPoint(layerPoint);
            var binCoord = this._getBinCoordFromLayerPoint(layerPoint, this.options.tileSize);
            var bucketBinCoord = this._getBinCoordFromLayerPoint(layerPoint, this.resolution);

            // grab the cached data value
            var key = this._cacheKeyFromCoord(coord);
            var cached = this._cache[key];
            if (!cached) {
                console.error('No cached data found for key ' + key);
                return;
            }

            var self = this;

            // Broad-phase + brute force test of position against hitboxes.  Do dist vs 
            // radius test if need more accuracy, implement spatial hashing if 
            // needs to handle more than a handful of points.
            _.forEach(cached.hitBoxes, function(hitBox) {
                if (binCoord.x >= hitBox.x && binCoord.x <= hitBox.x + hitBox.w &&
                    binCoord.y >= hitBox.y && binCoord.y <= hitBox.y + hitBox.h) {
                    _.forIn(cached.tiles, function(tile) {
                        var box = {
                            x: hitBox.x + (hitBox.w / 2), 
                            y: hitBox.y + (hitBox.h / 2)
                        };
                        self._renderHighlight(tile, box);
                    });
                    var data = cached.data[bucketBinCoord.index];
                    if (data) {
                        // execute callback
                        if (self.options.handlers.mousemove) {
                            self.options.handlers.mousemove(target, {
                                value: data,
                                x: coord.x,
                                y: coord.z,
                                z: coord.z,
                                bx: binCoord.x,
                                by: binCoord.y,
                                type: 'preview',
                                layer: this
                            });
                        }
                        return false;
                    }
                }
            });
        }
    });

    module.exports = PointsOfInterest;

}());
