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
            selectedColor: [255, 100, 255, 255],
            highlightedColor: [200, 0, 255, 255],
            downSampleFactor: 8
        },

        highlighted: null,

        selected: null,

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
        },

        clearHighlight: function () {
            if (this.highlighted) {
                this.highlighted = null;
                this.clearTiles();
            }
        },

        clearSelection: function () {
            if (this.selected) {
                this.selected = null;
                this.clearTiles();
            }
        },

        setSelection: function(value) {
            this.clearSelection();
            this.selected = value;
        },

        setHighlight: function(value) {
            this.clearHighlight();
            this.highlighted = value;
        },

        onClick: function (e) {
            var target = e.originalEvent.target;
            var bin = this._getBinData(e);
            if (bin) {
                // execute callback
                this.fire('click', {
                    elem: target,
                    value: bin
                });
                // flag as selected
                this.setSelection(bin);
                this._highlightTrails();
                return;
            }
            // clear selected flag
            this.clearSelection();
            this._highlightTrails();
        },

        onMouseMove: function(e) {
            var target = e.originalEvent.target;
            var bin = this._getBinData(e);
            if (bin) {
                // execute callback
                if (!this.highlighted) {
                   this.fire('mouseover', {
                        elem: target,
                        value: bin
                    });
                }
                // flag as highlighted
                this.setHighlight(bin);
                this._highlightTrails();
                // set cursor
                $(this._map._container).css('cursor', 'pointer');
                // exit early
                return;
            }
            // mouse out
            if (this.highlighted) {
                this.fire('mouseout', {
                    elem: target,
                    value: this.highlighted
                });
            }
            this.clearHighlight();
            this._highlightTrails();
        },

        _getBinData: function(e) {
            // get layer coord
            var layerPoint = this.getLayerPointFromEvent(e.originalEvent);
            // get tile coord
            var coord = this.getTileCoordFromLayerPoint(layerPoint);
            // get cache key
            var nkey = this.cacheKeyFromCoord(coord, true);
            // get cache entry
            var cached = this._cache[nkey];
            if (cached && cached.pixels) {
                // get bin coordinate
                var bin = this.getBinCoordFromLayerPoint(layerPoint);
                // downsample the bin res
                var x = Math.floor(bin.x / this.options.downSampleFactor);
                var y = Math.floor(bin.y / this.options.downSampleFactor);
                // if hits a pixel
                if (cached.pixels[x] && cached.pixels[x][y]) {
                    var ids = Object.keys(cached.pixels[x][y]);
                    // take first entry
                    var id = ids[0];
                    // create collision object
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
                    return collision;
                }
            }
            return null;
        },

        _highlightTrailsForData: function(cached) {
            var self = this;
            var selected = this.selected;
            var highlighted = this.highlighted;
            if (cached.data) {
                var trail;
                if (selected) {
                    trail = cached.trails[selected.value];
                    if (trail) {
                        // for each tile relying on that data
                        _.forIn(cached.tiles, function(tile) {
                            self._renderTrail(tile, trail, self.options.selectedColor);
                        });
                    }
                }
                if (highlighted) {
                    trail = cached.trails[highlighted.value];
                    if (trail) {
                        _.forIn(cached.tiles, function(tile) {
                            self._renderTrail(tile, trail, self.options.highlightedColor);
                        });
                    }
                }
            }
        },

        _highlightTrails: function() {
            var self = this;
            _.forIn(this._cache, function(cached) {
                self._highlightTrailsForData(cached);
            });
        },

        _renderTrail: function(canvas, pixels, color) {
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
                data[j * 4] = color[0];
                data[j * 4 + 1] = color[1];
                data[j * 4 + 2] = color[2];
                data[j * 4 + 3] = color[3];
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
            // make sure to highlight selected trails in the tile
            this._highlightTrailsForData(cached);
        }

    });

    module.exports = TopTrails;

}());
