(function() {

    'use strict';

    const Canvas = require('../../core/Canvas');
    const ColorRamp = require('../../mixin/ColorRamp');
    const ValueTransform = require('../../mixin/ValueTransform');

    const Heatmap = Canvas.extend({

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
            const canvas = document.createElement('canvas');
            canvas.height = resolution;
            canvas.width = resolution;
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, resolution, resolution);
            const data = imageData.data;
            const color = [0, 0, 0, 0];
            let nval = 0;
            let rval = 0;
            let bin = 0;
            for (let i=0; i<bins.length; i++) {
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
            const bins = new Float64Array(data);
            const resolution = Math.sqrt(bins.length);
            const ramp = this.getColorRamp();
            const tileCanvas = this.renderCanvas(bins, resolution, ramp);
            const ctx = canvas.getContext('2d');
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
