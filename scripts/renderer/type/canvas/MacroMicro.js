(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');
    var ColorRamp = require('../../mixin/ColorRamp');
    var ValueTransform = require('../../mixin/ValueTransform');

    var MacroMicro = Canvas.extend({

        includes: [
            // mixins
            ColorRamp,
            ValueTransform
        ],

        options: {
            fillColor: 'rgba(10, 80, 20, 0.5)',
            strokeColor: '#ffffff',
            strokeWidth: 1,
            pointRadius: 6
        },

        initialize: function() {
            if (!this.layers.micro || !this.layers.macro) {
                throw 'MacroMicro renderer requires `micro` and `macro` sub-layers';
            }
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
        },

        renderMacroCanvas: function(bins, resolution, ramp) {
            var canvas = document.createElement('canvas');
            canvas.height = resolution;
            canvas.width = resolution;
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, resolution, resolution);
            var data = imageData.data;
            var self = this;
            var color = [0, 0, 0, 0];
            var nval, rval, bin, i;
            for (i=0; i<bins.length; i++) {
                bin = bins[i];
                if (bin === 0) {
                    color[0] = 0;
                    color[1] = 0;
                    color[2] = 0;
                    color[3] = 0;
                } else {
                    nval = self.transformValue(bin);
                    rval = self.interpolateToRange(nval);
                    ramp(rval, color);
                }
                data[i * 4] = color[0];
                data[i * 4 + 1] = color[1];
                data[i * 4 + 2] = color[2];
                data[i * 4 + 3] = color[3];
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        },

        renderMicroCanvas: function(canvas, pixels) {
            var fillColor = this.options.fillColor;
            var strokeColor = this.options.strokeColor;
            var strokeWidth = this.options.strokeWidth;
            var pointRadius = this.options.pointRadius;
            var bufferRadius = pointRadius + strokeWidth;
            var bufferDiameter = bufferRadius * 2;
            var TILE_SIZE = 256;
            // buffer the canvas so that none of the points are cut off
            // ensure the DOM size is the same as the canvas
            $(canvas).css({
                'width': TILE_SIZE + bufferDiameter,
                'height': TILE_SIZE + bufferDiameter,
                'margin-top': -bufferRadius,
                'margin-left': -bufferRadius
            });

            var devicePixelFactor = (L.Browser.retina) ? 2 : 1;
            canvas.width = (TILE_SIZE + bufferDiameter) * devicePixelFactor;
            canvas.height = (TILE_SIZE + bufferDiameter) * devicePixelFactor;
            
            var ctx = canvas.getContext('2d');
            ctx.globalCompositeOperation = 'lighter';

            pixels.forEach(function(pixel) {
                ctx.beginPath();
                ctx.fillStyle = fillColor;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.arc(
                    (bufferRadius + pixel.x) * devicePixelFactor,
                    (bufferRadius + pixel.y) * devicePixelFactor,
                    pointRadius * devicePixelFactor,
                    0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });
        },

        extractExtrema: function(res) {
            if (res.type === 'macro') {
                var bins = new Float64Array(res.data);
                return {
                    min: _.min(bins),
                    max: _.max(bins)
                };
            }
            return {
                min: Infinity,
                max: -Infinity
            };
        },

        renderTile: function(canvas, res, coords) {
            if (!res) {
                return;
            }
            var type = res.type;
            var data = res.data;
            if (type === 'macro') {
                // macro
                var bins = new Float64Array(data);
                var resolution = Math.sqrt(bins.length);
                var ramp = this.getColorRamp();
                var tileCanvas = this.renderMacroCanvas(bins, resolution, ramp);
                var ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    tileCanvas,
                    0, 0,
                    resolution, resolution,
                    0, 0,
                    canvas.width, canvas.height);
            } else {
                // micro
                var micro = this.layers.micro;
                var xField = micro.getXField();
                var yField = micro.getYField();
                var zoom = coords.z;
                var pixels = [];
                data.forEach(function(hit) {
                    var x = _.get(hit, xField);
                    var y = _.get(hit, yField);
                    if (x !== undefined && y !== undefined) {
                        // TODO: THESE ARE WRONG?
                        var layerPixel = micro.getLayerPointFromDataPoint(x, y, zoom);
                        pixels.push({
                            x: Math.floor(layerPixel.x % 256),
                            y: Math.floor(layerPixel.y % 256)
                        });
                    }
                });
                this.renderMicroCanvas(canvas, pixels);
            }
        }

    });

    module.exports = MacroMicro;

}());
