(function() {

    'use strict';

    let esper = require('esper');
    let WebGL = require('../../core/WebGL');
    let ColorRamp = require('../../mixin/ColorRamp');
    let ValueTransform = require('../../mixin/ValueTransform');
    let Shaders = require('./Shaders');

    let TILE_SIZE = 256;

    function encode(enc, val) {
        enc[0] = (val / 16777216.0) & 0xFF;
        enc[1] = (val / 65536.0) & 0xFF;
        enc[2] = (val / 256.0) & 0xFF;
        enc[3] = val & 0xFF;
        return enc;
    }

    let Heatmap = WebGL.extend({

        includes: [
            // mixins
            ColorRamp,
            ValueTransform
        ],

        onWebGLInit: function(done) {
            // ensure we use the correct context
            esper.WebGLContext.bind(this._container);
            // quad vertices
            let vertices = new Float32Array([
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
            // quad buffer
            this._quadBuffer = new esper.VertexBuffer(
                vertices,
                {
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
                },
                {
                    count: 6,
                });
            // load shader
            this._shader = new esper.Shader({
                vert: Shaders.heatmap.vert,
                frag: Shaders.heatmap.frag
            }, err => {
                if (err) {
                    done(err);
                }
                done(null);
            });
        },

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
        },

        onCacheLoad: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            if (cached.data && cached.data.byteLength > 0) {
                this.bufferTileTexture(cached, coords);
            }
        },

        onExtremaChange: function() {
            _.forIn(this._cache, cached => {
                if (cached.data && cached.data.byteLength > 0) {
                    this.bufferTileTexture(cached);
                }
            });
        },

        bufferTileTexture: function(cached) {
            let data = new Float64Array(cached.data);
            let resolution = Math.sqrt(data.length);
            let bins = new Uint8Array(data.length * 4);
            let enc = [0, 0, 0, 0];
            let bin, i;
            let sum = 0;
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

        getWrapAroundOffset: function(coords) {
            let size = Math.pow(2, this._map.getZoom());
            // create model matrix
            let xWrap = Math.floor(coords.x / size);
            let yWrap = Math.floor(coords.y / size);
            return [
                size * TILE_SIZE * xWrap,
                size * TILE_SIZE * yWrap
            ];
        },

        getProjectionMatrix: function() {
            let size = this._map.getSize();
            return this.getOrthoMatrix(
                0,
                size.x,
                0,
                size.y,
                -1, 1);
        },

        getViewOffset: function() {
            let bounds = this._map.getPixelBounds();
            let dim = Math.pow(2, this._map.getZoom()) * TILE_SIZE;
            return [
                bounds.min.x,
                dim - bounds.max.y
            ];
        },

        renderTiles: function() {
            let buffer = this._quadBuffer;
            let shader = this._shader;
            let zoom = this._map.getZoom();
            let dim = Math.pow(2, zoom) * TILE_SIZE;
            // bind buffer
            buffer.bind();
            // calc view offset
            let viewOffset = this.getViewOffset();
            // for each tile
            _.forIn(this._cache, cached => {
                if (!cached.texture) {
                    return;
                }
                // bind tile texture to texture unit 0
                cached.texture.bind(0);
                _.forIn(cached.tiles, (tile, key) => {
                    // find the tiles position from its key
                    let coords = this.coordFromCacheKey(key);
                    // NOTE: we have to check here if the tiles are stale or not
                    if (coords.z !== zoom) {
                        return;
                    }
                    // upload view offset
                    let offset = this.getWrapAroundOffset(coords);
                    let totalOffset = [
                        viewOffset[0] - offset[0],
                        viewOffset[1] - offset[1],
                    ];
                    shader.setUniform('uViewOffset', totalOffset);
                    let tileOffset = [
                        TILE_SIZE * coords.x,
                        (this.options.tms) ? (TILE_SIZE * (coords.y + 1)) : dim - (TILE_SIZE * coords.y)
                    ];
                    // create model matrix
                    shader.setUniform('uTileOffset', tileOffset);
                    // draw the tile
                    buffer.draw();
                });
                // unbind texture
                cached.texture.unbind();
            });
            // unbind buffer
            buffer.unbind();
        },

        renderFrame: function() {
            // setup
            this._viewport.push();
            this._shader.use();
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
            this._viewport.pop();
        }

    });

    module.exports = Heatmap;

}());
