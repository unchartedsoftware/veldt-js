(function() {

    'use strict';

    let Canvas = require('../../core/Canvas');

    let Preview = Canvas.extend({

        options: {
            lineWidth: 1,
            lineColor: '#fff'
        },

        highlighted: false,

        _drawHighlight: function(canvas, x, y, size) {
            let ctx = canvas.getContext('2d');
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
            let target = e.originalEvent.target;
            if (this.highlighted) {
                // clear existing highlight
                this.clearTiles();
            }
            // get layer coord
            let layerPoint = this.getLayerPointFromEvent(e.originalEvent);
            // get tile coord
            let coord = this.getTileCoordFromLayerPoint(layerPoint);
            // get cache key
            let nkey = this.cacheKeyFromCoord(coord, true);
            // get cache entry
            let cached = this._cache[nkey];
            if (cached && cached.data) {
                // get bin coordinate
                let bin = this.getBinCoordFromLayerPoint(layerPoint);
                // get bin data entry
                let data = cached.data[bin.index];
                if (data) {
                    // for each tile relying on that data
                    _.forIn(cached.tiles, tile => {
                        this._drawHighlight(tile, bin.x, bin.y, bin.size);
                    });
                    let collision = {
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
                        this.fire('mouseover', {
                            elem: target,
                            value: collision
                        });
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
                this.fire('mouseout', {
                    elem: target,
                    value: this.highlighted
                });
            }
            // clear highlighted flag
            this.highlighted = null;
        }

    });

    module.exports = Preview;

}());
