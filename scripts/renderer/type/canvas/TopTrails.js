(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');
    var ColorRamp = require('../../mixin/ColorRamp');
    var ValueTransform = require('../../mixin/ValueTransform');

    var TopTrails = Canvas.extend({

        includes: [
            // mixins
            ColorRamp,
            ValueTransform
        ],

        options: {
            color: [255, 0, 255, 255],
            downSampleFactor: 8
        },

        highlighted: false,

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
        },

        onMouseMove: function(e) {
            var target = $(e.originalEvent.target);
            if (this.highlighted) {
                // clear existing highlights
                this.clearTiles();
            }
            // get layer coord
            var layerPoint = this._getLayerPointFromEvent(e.originalEvent);
            // get tile coord
            var coord = this._getTileCoordFromLayerPoint(layerPoint);
            // get cache key
            var nkey = this.cacheKeyFromCoord(coord, true);
            // get cache entry
            var cached = this._cache[nkey];
            if (cached && cached.pixels) {
                // get bin coordinate
                var bin = this._getBinCoordFromLayerPoint(layerPoint);
                // downsample the bin res
                var x = Math.floor(bin.x / this.options.downSampleFactor);
                var y = Math.floor(bin.y / this.options.downSampleFactor);
                // if hits a pixel
                if (cached.pixels[x] && cached.pixels[x][y]) {
                    var ids = Object.keys(cached.pixels[x][y]);
                    // take first entry
                    var id = ids[0];
                    // for each cache entry
                    var self = this;
                    _.forIn(this._cache, function(cached) {
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
                    var collision = {
                        value: id,
                        x: coord.x,
                        y: coord.z,
                        z: coord.z,
                        bx: bin.x,
                        by: bin.y,
                        type: 'top-trails',
                        layer: this
                    };
                    // execute callback
                    if (!this.highlighted) {
                        if (this.options.handlers.mouseover) {
                            this.options.handlers.mouseover(target, collision);
                        }
                    }
                    // flag as highlighted
                    this.highlighted = collision;
                    // set cursor
                    $(this._map._container).css('cursor', 'pointer');
                    return;
                }
            }
            // mouse out
            if (this.highlighted) {
                if (this.options.handlers.mouseout) {
                    this.options.handlers.mouseout(target, this.highlighted);
                }
            }
            // clear highlighted flag
            this.highlighted = null;
        },

        _highlightTrail: function(canvas, pixels) {
            var resolution = this.getResolution();
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
                data[j * 4] = this.options.color[0];
                data[j * 4 + 1] = this.options.color[1];
                data[j * 4 + 2] = this.options.color[2];
                data[j * 4 + 3] = this.options.color[3];
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
            if (!data) {
                return;
            }
            // modify cache entry
            var nkey = this.cacheKeyFromCoord(coord, true);
            var cached = this._cache[nkey];
            if (cached.trails) {
                // trails already added, exit early
                return;
            }
            var trails = cached.trails = {};
            var pixels = cached.pixels = {};
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
                    rx = Math.floor(bin[0] / this.options.downSampleFactor);
                    ry = Math.floor(bin[1] / this.options.downSampleFactor);
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
