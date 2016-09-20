(function() {

    'use strict';

    let esper = require('esper');
    let WebGL = require('../../core/WebGL');
    let ColorRamp = require('../../mixin/ColorRamp');
    let ValueTransform = require('../../mixin/ValueTransform');
    let Shaders = require('./Shaders');

    let TILE_SIZE = 256;
    let HORIZONTAL_TILES = 16;
    let VERTICAL_TILES = 8;

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
            // mega texture for all tiles
            this._megaTexture =  new esper.Texture2D({
                width: TILE_SIZE * HORIZONTAL_TILES,
                height: TILE_SIZE * VERTICAL_TILES,
                src: null,
                mipMap: false,
                format: 'RGBA',
                type: 'UNSIGNED_BYTE',
                wrap: 'CLAMP_TO_EDGE',
                filter: 'NEAREST',
                invertY: true
            });
            // init the chunks
            this.initChunks();
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

        initChunks: function() {
            // ensure we use the correct context
            esper.WebGLContext.bind(this._container);
            // allocate available chunks
            this._availableChunks = new Array(HORIZONTAL_TILES*VERTICAL_TILES);
            for (let i=0; i<HORIZONTAL_TILES; i++) {
                for (let j=0; j<VERTICAL_TILES; j++) {
                    this._availableChunks[i*VERTICAL_TILES + j] = {
                        xOffset: i * TILE_SIZE,
                        yOffset: j * TILE_SIZE,
                        resolution: null
                    };
                }
            }
            this._usedChunks = {};
        },

        addTileToBuffer: function(coords, data) {
            if (this._availableChunks.length === 0) {
                console.warn('No available chunks remaining to buffer data');
                return;
            }
            // get an available chunk
            let chunk = this._availableChunks.pop();
            // set chunk resolution
            chunk.resolution = Math.sqrt(data.length / 4);
            // buffer the data into the physical chunk
            this._megaTexture.bufferSubData(
                data,
                chunk.xOffset,
                chunk.yOffset,
                chunk.resolution,
                chunk.resolution);
            // flag as used
            let ncoords = this.getNormalizedCoords(coords);
            let hash = this.cacheKeyFromCoord(ncoords);
            this._usedChunks[hash] = chunk;
        },

        removeTileFromBuffer: function(coords) {
            let ncoords = this.getNormalizedCoords(coords);
            let hash = this.cacheKeyFromCoord(ncoords);
            let chunk = this._usedChunks[hash];
            if (chunk) {
                // clear the count
                chunk.count = 0;
                delete this._usedChunks[hash];
                // add as a new available chunk
                this._availableChunks.push(chunk);
            }
        },

        onCacheLoad: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            if (cached.data && cached.data.byteLength > 0) {
                this.bufferTileTexture(cached, coords);
            }
        },

        onCacheUnload: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            if (cached.data && cached.data.byteLength > 0) {
                this.removeTileFromBuffer(coords);
            }
        },

        bufferTileTexture: function(cached, coords) {
            let data = new Float64Array(cached.data);
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
                this.addTileToBuffer(coords, bins);
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
            let cache = this._cache;
            let zoom = this._map.getZoom();
            let dim = Math.pow(2, zoom) * TILE_SIZE;
            // calc view offset
            let viewOffset = this.getViewOffset();
            _.forIn(this._usedChunks, (chunk, hash) => {
                // for each tile referring to the data
                let cached = cache[hash];
                if (cached) {
                    // render for each tile
                    _.keys(cached.tiles).forEach(hash => {
                        // find the tiles position from its key
                        let coords = this.coordFromCacheKey(hash);
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
                        // uv offset
                        let uvOffset = [
                            chunk.xOffset / (TILE_SIZE * HORIZONTAL_TILES),
                            chunk.yOffset / (TILE_SIZE * VERTICAL_TILES)
                        ];
                        shader.setUniform('uTextureCoordOffset', uvOffset);
                        let uvExtent = [
                            (chunk.resolution / TILE_SIZE) / HORIZONTAL_TILES,
                            (chunk.resolution / TILE_SIZE) / VERTICAL_TILES
                        ];
                        shader.setUniform('uTextureCoordExtent', uvExtent);
                        // draw the tile
                        buffer.draw();
                    });
                }
            });
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
            this._megaTexture.bind(0);
            // draw
            this._quadBuffer.bind();
            this.renderTiles();
            this._quadBuffer.unbind();
            // teardown
            this._megaTexture.unbind();
            this._viewport.pop();
        }

    });

    module.exports = Heatmap;

}());
