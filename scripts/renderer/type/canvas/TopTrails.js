(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');

    var TopTrails = Canvas.extend({

        options: {
            color: [255, 0, 255, 255],
            downSampleFactor: 8
        },

        highlighted: false,
        selectedBinData: null,

        isTargetLayer: function( elem ) {
            return this._container && $.contains(this._container, elem );
        },

        clearSelection: function () {
            this.selectedBinData = null;
            this._clearTiles();
        },

        setSelection: function(id) {
            this.clearSelection();
            this.selectedBinData = {
                value: id
            };
            this._highlightBinTrail(this.selectedBinData);
        },

        onClick: function (e) {
            this.clearSelection();

            if (!this.isTargetLayer(e.originalEvent.target) ||
                !this.options.handlers.click) {
                return;
            }
            var target = $(e.originalEvent.target);
            var binData = this._getEventBinData(e.originalEvent);

            this._highlightBinTrail(binData);
            this.selectedBinData = binData;
            this.options.handlers.click(target, binData);
        },

        onMouseMove: function(e) {
            var target = $(e.originalEvent.target);
            if (this.highlighted) {
                // clear existing highlights
                this._clearTiles();
                // Re-highlight selected trail
                if (this.selectedBinData) {
                    this._highlightBinTrail(this.selectedBinData);
                }
                // clear highlighted flag
                this.highlighted = false;
                this._container.style.cursor = 'inherit';
            }
            var binData = this._getEventBinData(e);

            this._highlightBinTrail(binData);
            if (this.options.handlers.mousemove) {
                this.options.handlers.mousemove(target, binData);
            }
        },

        _highlightBinTrail: function(binData) {
            if (binData) {
                var id = binData.value;
                // for each cache entry
                var self = this;
                _.forIn(this._cache, function(cached) {
                    if (cached.data) {
                        // for each tile relying on that data
                        _.forIn(cached.tiles, function(tile) {
                            var trail = cached.trails[id];
                            if (trail) {
                                self._highlightTrail(tile, trail);
                                self.highlighted = true;
                                self._container.style.cursor = 'pointer';
                            }
                        });
                    }
                });
            }
        },

        _getEventBinData: function (e) {
            // get layer coord
            var layerPoint = this._getLayerPointFromEvent(e);
            // get tile coord
            var coord = this._getTileCoordFromLayerPoint(layerPoint);
            // get cache key
            var nkey = this._cacheKeyFromCoord(coord);
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
                    return {
                        value: id,
                        x: coord.x,
                        y: coord.z,
                        z: coord.z,
                        bx: bin.x,
                        by: bin.y,
                        type: 'top-trails',
                        layer: this
                    };
                }
            }
            return null;
        },

        _highlightTrail: function(canvas, pixels) {
            var resolution = this.getResolution() || this.options.tileSize;
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
            // ensure tile accepts mouse events
            $(container).css('pointer-events', 'all');        
            // modify cache entry
            var hash = this._cacheKeyFromCoord(coord);
            var cached = this._cache[hash];
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
            if (this.selectedBinData) {
                // Make sure to highlight selected trails in the tile
                this._highlightBinTrail(this.selectedBinData);
            }
        }

    });

    module.exports = TopTrails;

}());
