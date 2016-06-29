(function() {

    'use strict';

    var esper = require('esper');
    var WebGL = require('../../core/WebGL');
    var ColorRamp = require('../../mixin/ColorRamp');
    var ValueTransform = require('../../mixin/ValueTransform');
    var Shaders = require('./Shaders');

    var TILE_SIZE = 256;

    var Heatmap = WebGL.extend({

        includes: [
            // mixins
            ColorRamp,
            ValueTransform
        ],

        options: {
            shaders: Shaders.heatmap
        },

        onWebGLInit: function() {
            var vertices = new Float32Array([
                // positions
                0, -TILE_SIZE,
                TILE_SIZE, -TILE_SIZE,
                TILE_SIZE, 0,
                0, -TILE_SIZE,
                TILE_SIZE, 0,
                0, 0,
                // uvs
                0, 0,
                1, 0,
                1, 1,
                0, 0,
                1, 1,
                0, 1
            ]);
            this._quadBuffer = new esper.VertexBuffer(vertices, {
                0: {
                    size: 2,
                    type: 'FLOAT',
                    byteOffset: 0
                },
                1: {
                    size: 2,
                    type: 'FLOAT',
                    byteOffset: 2 * 6 * 4
                }
            });
        },

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
        },

        onCacheLoad: function(event) {
            var cached = event.entry;
            var coords = event.coords;
            if (cached.data && cached.data.byteLength > 0) {
                this.bufferTileTexture(cached, coords);
            }
        },

        onExtremaChange: function() {
            var self = this;
            _.forIn(this._cache, function(cached) {
                if (cached.data && cached.data.byteLength > 0) {
                    self.bufferTileTexture(cached);
                }
            });
        },

        bufferTileTexture: function(cached) {
            var data = new Float64Array(cached.data);
            var resolution = Math.sqrt(data.length);
            var buffer = new ArrayBuffer(data.length * 4);
            var bins = new Uint8Array(buffer);
            var color = [0, 0, 0, 0];
            var nval, rval, bin, i;
            var ramp = this.getColorRamp();
            var self = this;
            for (i=0; i<data.length; i++) {
                bin = data[i];
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
                bins[i * 4] = color[0];
                bins[i * 4 + 1] = color[1];
                bins[i * 4 + 2] = color[2];
                bins[i * 4 + 3] = color[3];
            }
            // ensure we use the correct context
            esper.WebGLContext.bind(this._container);
            // create the texture
            cached.texture = new esper.Texture2D({
                height: resolution,
                width: resolution,
                src: bins,
                format: 'RGBA',
                type: 'UNSIGNED_BYTE',
                wrap: 'CLAMP_TO_EDGE',
                filter: 'NEAREST',
                invertY: true
            });
        },

        renderTiles: function() {
            var self = this;
            var buffer = this._quadBuffer;
            var shader = this._shader;
            var dim = Math.pow(2, this._map.getZoom()) * TILE_SIZE;
            // bind buffer
            buffer.bind();
            // for each tile
            _.forIn(this._cache, function(cached) {
                if (!cached.texture) {
                    return;
                }
                // bind tile texture to texture unit 0
                cached.texture.push(0);
                _.forIn(cached.tiles, function(tile, key) {
                    // find the tiles position from its key
                    var coord = self.coordFromCacheKey(key);
                    // create model matrix
                    var model = self.getTranslationMatrix(
                        TILE_SIZE * coord.x,
                        dim - (TILE_SIZE * coord.y),
                        0);
                    shader.setUniform('uModelMatrix', model);
                    // draw the tile
                    buffer.draw();
                });
                // no need to unbind texture
            });
            // unbind buffer
            buffer.unbind();
        },

        renderFrame: function() {
            // setup
            this._viewport.push();
            this._shader.push();
            // set uniforms
            this._shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            this._shader.setUniform('uOpacity', this.getOpacity());
            this._shader.setUniform('uTextureSampler', 0);
            // draw
            this.renderTiles();
            // teardown
            this._shader.pop();
            this._viewport.pop();
        }

    });

    module.exports = Heatmap;

}());
