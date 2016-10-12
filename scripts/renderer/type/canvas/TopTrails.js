(function() {

    'use strict';

    const Canvas = require('../../core/Canvas');
    const ColorRamp = require('../../mixin/ColorRamp');
    const ValueTransform = require('../../mixin/ValueTransform');

    const TopTrails = Canvas.extend({

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

        clearHighlight: function() {
            if (this.highlighted) {
                this.highlighted = null;
                this._highlightTrails();
            }
        },

        clearSelection: function() {
            if (this.selected) {
                this.selected = null;
                this._highlightTrails();
            }
        },

        setSelection: function(value) {
            this.clearSelection();
            this.selected = value;
            this._highlightTrails();
        },

        setHighlight: function(value) {
            this.clearHighlight();
            this.highlighted = value;
            this._highlightTrails();
        },

        onClick: function(e) {
            const target = e.originalEvent.target;
            const bin = this._getBinData(e);
            if (bin) {
                // execute callback
                this.fire('click', {
                    elem: target,
                    value: bin
                });
                // flag as selected
                this.setSelection(bin);
                return;
            }
            // clear selected flag
            this.clearSelection();
        },

        onMouseMove: function(e) {
            const target = e.originalEvent.target;
            const bin = this._getBinData(e);
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
        },

        _getBinData: function(e) {
            // get layer coord
            const layerPoint = this.getLayerPointFromEvent(e.originalEvent);
            // get tile coord
            const coord = this.getTileCoordFromLayerPoint(layerPoint);
            // get cache key
            const nkey = this.cacheKeyFromCoord(coord, true);
            // get cache entry
            const cached = this._cache[nkey];
            if (cached && cached.pixels) {
                // get bin coordinate
                const bin = this.getBinCoordFromLayerPoint(layerPoint);
                // downsample the bin res
                const x = Math.floor(bin.x / this.options.downSampleFactor);
                const y = Math.floor(bin.y / this.options.downSampleFactor);
                // if hits a pixel
                if (cached.pixels[x] && cached.pixels[x][y]) {
                    const ids = Object.keys(cached.pixels[x][y]);
                    // take first entry
                    const id = ids[0];
                    // create collision object
                    const collision = {
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
            const selected = this.selected;
            const highlighted = this.highlighted;
            if (cached.data) {
                let trail;
                if (selected) {
                    trail = cached.trails[selected.value];
                    if (trail) {
                        // for each tile relying on that data
                        _.forIn(cached.tiles, tile => {
                            this._renderTrail(tile, trail, this.options.selectedColor);
                        });
                    }
                }
                if (highlighted) {
                    trail = cached.trails[highlighted.value];
                    if (trail) {
                        _.forIn(cached.tiles, tile => {
                            this._renderTrail(tile, trail, this.options.highlightedColor);
                        });
                    }
                }
            }
        },

        _highlightTrails: function() {
            this.clearTiles();
            _.forIn(this._cache, cached => {
                this._highlightTrailsForData(cached);
            });
        },

        _renderTrail: function(canvas, pixels, color) {
            const resolution = this.getResolution();
            const highlight = document.createElement('canvas');
            highlight.height = resolution;
            highlight.width = resolution;
            const highlightCtx = highlight.getContext('2d');
            const imageData = highlightCtx.getImageData(0, 0, resolution, resolution);
            const data = imageData.data;
            let pixel, x, y, i, j;
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
            const ctx = canvas.getContext('2d');
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
            const nkey = this.cacheKeyFromCoord(coord, true);
            const cached = this._cache[nkey];
            if (cached.trails) {
                // trails already added, exit early
                return;
            }
            const trails = cached.trails = {};
            const pixels = cached.pixels = {};
            const ids  = Object.keys(data);
            for (let i=0; i<ids.length; i++) {
                const id = ids[i];
                const bins = data[id];
                for (let j=0; j<bins.length; j++) {
                    const bin = bins[j];
                    // down sample the pixel to make interaction easier
                    const rx = Math.floor(bin[0] / this.options.downSampleFactor);
                    const ry = Math.floor(bin[1] / this.options.downSampleFactor);
                    pixels[rx] = pixels[rx] || {};
                    pixels[rx][ry] = pixels[rx][ry] || {};
                    pixels[rx][ry][id] = true;
                    // add pixel under the trail at correct resolution
                    const x = bin[0];
                    const y = bin[1];
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
