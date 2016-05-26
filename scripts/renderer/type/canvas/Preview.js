(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');

    var Preview = Canvas.extend({

        options: {
            lineWidth: 2,
            lineColor: 'lightblue'
        },

        highlighted: false,

        _drawHighlight: function(canvas, x, y, size) {
            var ctx = canvas.getContext('2d');
            ctx.beginPath();
            ctx.fillStyle = this.options.fillColor;
            ctx.rect(
                x * size,
                y * size,
                size,
                size);
            ctx.lineWidth = this.options.lineWidth;
            ctx.strokeStyle = this.options.lineColor;
            ctx.stroke();
        },

        onMouseMove: function(e) {
            var target = $(e.originalEvent.target);
            if (this.highlighted) {
                // clear existing highlight
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
            if (cached && cached.data) {
                // get bin coordinate
                var bin = this._getBinCoordFromLayerPoint(layerPoint);
                // get bin data entry
                var data = cached.data[bin.index];
                if (data) {
                    // for each tile relying on that data
                    var self = this;
                    _.forIn(cached.tiles, function(tile) {
                        self._drawHighlight(tile, bin.x, bin.y, bin.size);
                    });
                    var collision = {
                        value: data,
                        x: coord.x,
                        y: coord.z,
                        z: coord.z,
                        bx: bin.x,
                        by: bin.y,
                        type: 'preview',
                        layer: this
                    };
                    if (!this.highlighted) {
                        // execute callback
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
        }

    });

    module.exports = Preview;

}());
