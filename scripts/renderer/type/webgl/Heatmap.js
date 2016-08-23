(function() {

    'use strict';

    var esper = require('esper');
    var WebGL = require('../../core/WebGL');
    var ColorRamp = require('../../mixin/ColorRamp');
    var ValueTransform = require('../../mixin/ValueTransform');
    var Shaders = require('./Shaders');

    var TILE_SIZE = 256;

    function encode(enc, val) {
        enc[0] = (val / 16777216.0) & 0xFF;
        enc[1] = (val / 65536.0) & 0xFF;
        enc[2] = (val / 256.0) & 0xFF;
        enc[3] = val & 0xFF;
        return enc;
    }

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
            var enc = [0, 0, 0, 0];
            var bin, i;
            var sum = 0;
            for (i=0; i<data.length; i++) {
                bin = data[i];
                sum += bin;
                encode(enc, bin);
                bins[i * 4] = enc[0];
                bins[i * 4 + 1] = enc[1];
                bins[i * 4 + 2] = enc[2];
                bins[i * 4 + 3] = enc[3];
            }
            if (sum > 0) {
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
            }
        },

        renderTiles: function() {
            var self = this;
            var buffer = this._quadBuffer;
            var shader = this._shader;
            var zoom = this._map.getZoom();
            var dim = Math.pow(2, zoom) * TILE_SIZE;
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
                    var coords = self.coordFromCacheKey(key);
                    // NOTE: we have to check here if the tiles are stale or not
                    if (coords.z !== zoom) {
                        return;
                    }
                    var x = TILE_SIZE * coords.x;
                    var y = (self.options.tms) ? (TILE_SIZE * (coords.y + 1)) : dim - (TILE_SIZE * coords.y);
                    // create model matrix
                    var model = self.getTranslationMatrix(x, y, 0);
                    shader.setUniform('uModelMatrix', model);
                    // draw the tile
                    buffer.draw();
                });
                // unbind texture
                cached.texture.pop(0);
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
            this._shader.setUniform('uRangeMin', this.getValueRange().min);
            this._shader.setUniform('uRangeMax', this.getValueRange().max);
            this._shader.setUniform('uMin', this.getExtrema().min);
            this._shader.setUniform('uMax', this.getExtrema().max);
            this._shader.setUniform('uTransformType', this.getTransformEnum());
            this._shader.setUniform('uTextureSampler', 0);
            this._shader.setUniform('uRamp', this.getColorRampTable());
            // draw
            this.renderTiles();
            // teardown
            this._shader.pop();
            this._viewport.pop();
        }

    });

    module.exports = Heatmap;

}());
