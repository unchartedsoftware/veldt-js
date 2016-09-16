(function() {

    'use strict';

    let Canvas = require('../../core/Canvas');
    let ColorRamp = require('../../mixin/ColorRamp');
    let ValueTransform = require('../../mixin/ValueTransform');

    let Heatmap = Canvas.extend({

        includes: [
            // mixins
            ColorRamp,
            ValueTransform
        ],

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
        },

        renderCanvas: function(bins, resolution, ramp) {
            let canvas = document.createElement('canvas');
            canvas.height = resolution;
            canvas.width = resolution;
            let ctx = canvas.getContext('2d');
            let imageData = ctx.getImageData(0, 0, resolution, resolution);
            let data = imageData.data;
            let color = [0, 0, 0, 0];
            let nval, rval, bin, i;
            for (i=0; i<bins.length; i++) {
                bin = bins[i];
                if (bin === 0) {
                    color[0] = 0;
                    color[1] = 0;
                    color[2] = 0;
                    color[3] = 0;
                } else {
                    nval = this.transformValue(bin);
                    rval = this.interpolateToRange(nval);
                    ramp(rval, color);
                }
                data[i * 4] = Math.round(color[0] * 255);
                data[i * 4 + 1] = Math.round(color[1] * 255);
                data[i * 4 + 2] = Math.round(color[2] * 255);
                data[i * 4 + 3] = Math.round(color[3] * 255);
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        },

        renderTile: function(canvas, data) {
            if (!data) {
                return;
            }
            let bins = new Float64Array(data);
            let resolution = Math.sqrt(bins.length);
            let ramp = this.getColorRamp();
            let tileCanvas = this.renderCanvas(bins, resolution, ramp);
            let ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                tileCanvas,
                0, 0,
                resolution, resolution,
                0, 0,
                canvas.width, canvas.height);
        }

    });

    module.exports = Heatmap;

}());
