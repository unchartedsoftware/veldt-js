(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');

    var Preview = Canvas.extend({
        HIGHLIGHT_LINE_WIDTH: 2,
        HIGHLIGHT_LINE_COLOUR: 'lightblue',
        HIGHLIGHT_FILL_COLOUR: 'darkblue',

        lastHitInfo: {
            canvas: null,
            tileX: 0,
            tileY: 0,
            tileZ: 0,
            bucketX: 0,
            bucketY: 0,
            bucketSize: 0
        },

        onAdd: function(map) {
            Canvas.prototype.onAdd.call(this, map);
            map.on('mousemove', this.onMouseOver, this);
        },

        onRemove: function(map) {
            Canvas.prototype.onRemove.class(this, map);
            map.off('mousemove', this.onMouseOver, this);
        },

        renderCanvas: function(bins, resolution) {
            var canvas = document.createElement('canvas');
            canvas.height = resolution;
            canvas.width = resolution;
            return canvas;
        },

        // possible to define this in stylesheet?
        renderTile: function(canvas, data) {
            if (!data) {
                return;
            }
            var resolution = Math.sqrt(data.length);
            var tileCanvas = this.renderCanvas(data, resolution);
            var ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                tileCanvas,
                0, 0,
                resolution, resolution,
                0, 0,
                canvas.width, canvas.height);
        },

        _findHitBucket: function(event, canvasSize) {
            var target = $(event.originalEvent.target);

            var x = parseInt(target.attr('data-x'), 10);
            var y = parseInt(target.attr('data-y'), 10);
            var z = this._map.getZoom();
            var key = x + ':' + y + ':' + z;
            var cacheEntry = this._cache[key];
            if (cacheEntry && cacheEntry.data) {
                var data = cacheEntry.data;
                var tile = cacheEntry.tiles[x + ':' + y];
                if (tile) {
                    var layerPt = event.layerPoint;
                    var resolution = Math.sqrt(data.length); 
                    var xBucket = Math.floor((layerPt.x - tile.offsetLeft) / canvasSize * resolution);
                    var yBucket = Math.floor((layerPt.y - tile.offsetTop) / canvasSize * resolution);
            
                    if (data[yBucket * resolution + xBucket]) {
                        var hitInfo = {};
                        hitInfo.tileX = x;
                        hitInfo.tileY = y;
                        hitInfo.tileZ = z;
                        hitInfo.bucketX = xBucket;
                        hitInfo.bucketY = yBucket;
                        hitInfo.bucketSize = canvasSize / resolution;
                        hitInfo.data = data[yBucket * resolution + xBucket]; 
                        return hitInfo;
                    }
                }
            }
            return null;
        }, 

        _drawHighlight: function(hitInfo) {
            var size = hitInfo.bucketSize;
            var sizeOver2 = size / 2;
            var ctx = hitInfo.canvas.getContext('2d');
            ctx.beginPath();
            ctx.fillStyle = this.HIGHLIGHT_FILL_COLOUR;
            ctx.arc(hitInfo.bucketX * size + sizeOver2, hitInfo.bucketY * size + sizeOver2, 
                    sizeOver2, 0, 2 * Math.PI, false);
            ctx.fill(); 
            ctx.lineWidth = this.HIGHLIGHT_LINE_WIDTH;
            ctx.strokeStyle = this.HIGHLIGHT_LINE_COLOUR;
            ctx.stroke();
        },

        _clearHighlight: function(hitInfo) {
            if (hitInfo.canvas) {
                var size = hitInfo.bucketSize;
                var ctx = hitInfo.canvas.getContext('2d');
                ctx.clearRect(hitInfo.bucketX * size - 1, hitInfo.bucketY * size - 1, 
                              size + this.HIGHLIGHT_LINE_WIDTH, size + this.HIGHLIGHT_LINE_WIDTH);
            }
       },

        onMouseOver: function(event) {
            this._clearHighlight(this.lastHitInfo);
            var canvas = $(event.originalEvent.target).context;
            var hitInfo = this._findHitBucket(event, canvas.width); 
            if (hitInfo) {
                hitInfo.canvas = canvas;
                this._drawHighlight(hitInfo);
                this.lastHitInfo = hitInfo;
                this.notifyDataChange(hitInfo.data.text);
            } else {
                this._clearHighlight(this.lastHitInfo);
                this.notifyDataChange(null);
            }
        }
    });
    module.exports = Preview;

}());
