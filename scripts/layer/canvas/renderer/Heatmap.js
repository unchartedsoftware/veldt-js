(function() {

    'use strict';

    var _ = require('lodash');

    module.exports = {

        extractExtrema: function(data) {
            var bins = new Float64Array(data);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        },

        renderCanvas: function(bins, resolution, rampFunc, type) {
            var canvas = document.createElement('canvas');
            canvas.height = resolution;
            canvas.width = resolution;
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, resolution, resolution);
            var data = imageData.data;
            var self = this;
            var color = [0, 0, 0, 0];
            bins.forEach(function(bin, index) {
                var val = self.transformValue(bin, type);
                val = Math.max(0, Math.min(1, val));
                if (val === 0) {
                    color[0] = 0;
                    color[1] = 0;
                    color[2] = 0;
                    color[3] = 0;
                } else {
                    rampFunc(val, color);
                }
                data[index * 4] = color[0];
                data[index * 4 + 1] = color[1];
                data[index * 4 + 2] = color[2];
                data[index * 4 + 3] = color[3];
            });
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        },

        renderTile: function(canvas, data) {
            if (!data) {
                return;
            }
            var bins = new Float64Array(data);
            var resolution = Math.sqrt(bins.length);
            var ramp = this.getColorRamp();
            var tileCanvas = this.renderCanvas(bins, resolution, ramp, 'log');
            var ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                tileCanvas,
                0, 0,
                resolution, resolution,
                0, 0,
                canvas.width, canvas.height);
        }

    };

}());
