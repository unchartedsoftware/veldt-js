(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');

    var TILE_SIZE = 256;
    var DOWN_SAMPLE = 8;

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    var TopTrails = Canvas.extend({

        highlighted: false,

        onMouseMove: function(e) {
            var self = this;
            if (this.highlighted) {
                // clear existing highlight
                _.forIn(this._tiles, function(tile) {
                    var ctx = tile.getContext('2d');
                    ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
                });
            }
            this.highlighted = false;
            // get pixel position in the layer
            var lonlat = this._map.mouseEventToLatLng(e);
            var pixel = this._map.project(lonlat);
            var zoom = this._map.getZoom();
            var pow = Math.pow(2, zoom);
            // get native layer pixel coords
            var nx = mod(pixel.x, pow * TILE_SIZE);
            var ny = mod(pixel.y, pow * TILE_SIZE);
            // get cache entry key for the tile
            var hash = this._cacheKeyFromCoord({
                x: Math.floor(nx / TILE_SIZE),
                y: Math.floor(ny / TILE_SIZE),
                z: zoom
            });
            var cached = this._cache[hash];
            if (cached.pixels) {
                // get pixels in tile coords
                var tx = mod(nx, TILE_SIZE);
                var ty = mod(ny, TILE_SIZE);
                // downsample them
                var resolution = this.getResolution() || TILE_SIZE;
                var pixelSize = TILE_SIZE / resolution;
                var downSample = pixelSize * DOWN_SAMPLE;
                var x = Math.floor(tx / downSample);
                var y = Math.floor(ty / downSample);
                // if hits a pixel
                if (cached.pixels[x] && cached.pixels[x][y]) {
                    // flag as highlighted
                    this.highlighted = true;
                    var ids = Object.keys(cached.pixels[x][y]);
                    // TODO: better metric for this
                    var id = ids[0];
                    // for each cache entry
                    _.forIn(self._cache, function(cached) {
                        if (cached.data) {
                            // for each tile relying on that data
                            _.forIn(cached.tiles, function(tile) {
                                var trail = cached.trails[id];
                                if (trail) {
                                    self._highlightTrail(tile, trail);
                                }
                            });
                        }
                    });
                }
            }
        },

        _highlightTrail: function(canvas, pixels) {
            var resolution = this.getResolution() || TILE_SIZE;
            var highlight = document.createElement('canvas');
            highlight.height = resolution;
            highlight.width = resolution;
            var highlightCtx = highlight.getContext('2d');
            var imageData = highlightCtx.getImageData(0, 0, resolution, resolution);
            var data = imageData.data;
            var pixel, x, y, i, j;
            for (i=0; i<pixels.length; i++) {
                pixel = pixels[i];
                x = pixel[0];
                y = pixel[1];
                j = x + (resolution * y);
                data[j * 4] = 255;
                data[j * 4 + 1] = 255;
                data[j * 4 + 2] = 255;
                data[j * 4 + 3] = 255;
            }
            highlightCtx.putImageData(imageData, 0, 0);
            // draw to tile
            var ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                highlight,
                0, 0,
                resolution, resolution,
                0, 0,
                canvas.width, canvas.height);
        },

        renderTile: function(container, data, coord) {
            // ensure tile accepts mouse events
            $(container).css('pointer-events', 'all');
            // modify cache entry
            var hash = this._cacheKeyFromCoord(coord);
            var cache = this._cache[hash];
            if (cache.trails) {
                // trails already added, exit early
                return;
            }
            var trails = cache.trails = {};
            var pixels = cache.pixels = {};
            var ids  = Object.keys(data);
            var bins, bin;
            var id, i, j;
            var rx, ry, x, y;
            for (i=0; i<ids.length; i++) {
                id = ids[i];
                bins = data[id];
                for (j=0; j<bins.length; j++) {
                    bin = bins[j];
                    // down sample the pixel to make interaction easier
                    rx = Math.floor(bin[0] / DOWN_SAMPLE);
                    ry = Math.floor(bin[1] / DOWN_SAMPLE);
                    pixels[rx] = pixels[rx] || {};
                    pixels[rx][ry] = pixels[rx][ry] || {};
                    pixels[rx][ry][id] = true;
                    // add pixel under the trail at correct resolution
                    x = bin[0];
                    y = bin[1];
                    trails[id] = trails[id] || [];
                    trails[id].push([ x, y ]);
                }
            }
        }

    });

    module.exports = TopTrails;

}());
