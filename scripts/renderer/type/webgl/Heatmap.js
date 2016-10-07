(function() {

    'use strict';

    let esper = require('esper');
    let WebGL = require('../../core/WebGL');
    let ColorRamp = require('../../mixin/ColorRamp');
    let ValueTransform = require('../../mixin/ValueTransform');
    let TextureAtlas = require('./TextureAtlas');
    let Shaders = require('./Shaders');
    let Shapes = require('./Shapes');

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
            // quad buffer
            this._quadBuffer = Shapes.quad.fill(TILE_SIZE);
            // texture atlas for all tiles
            this._atlas = new TextureAtlas();
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
                // add to atlas
                this.bufferTileTexture(cached, coords);
            }
        },

        onCacheUnload: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            if (cached.data && cached.data.byteLength > 0) {
                // remove from atlas
                let ncoords = this.getNormalizedCoords(coords);
                let hash = this.cacheKeyFromCoord(ncoords);
                this._atlas.removeTile(hash);
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
                let ncoords = this.getNormalizedCoords(coords);
                let hash = this.cacheKeyFromCoord(ncoords);
                this._atlas.addTile(hash, bins);
            }
        },

        renderTiles: function() {
            let buffer = this._quadBuffer;
            let shader = this._shader;
            let cache = this._cache;
            let zoom = this._map.getZoom();
            // calc view offset
            let viewOffset = this.getViewOffset();
            this._atlas.forEach((chunk, hash) => {
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
                        let tileOffset = this.getTileOffset(coords);
                        // create model matrix
                        shader.setUniform('uTileOffset', tileOffset);
                        // uv offset and extent
                        shader.setUniform('uTextureCoordOffset', chunk.uvOffset);
                        shader.setUniform('uTextureCoordExtent', chunk.uvExtent);
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
            this._atlas.texture.bind(0);
            // draw
            this._quadBuffer.bind();
            this.renderTiles();
            this._quadBuffer.unbind();
            // teardown
            this._atlas.texture.unbind();
            this._viewport.pop();
        }

    });

    module.exports = Heatmap;

}());
