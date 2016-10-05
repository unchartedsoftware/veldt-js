(function() {

    'use strict';

    let esper = require('esper');
    let WebGL = require('../../core/WebGL');
    let VertexAtlas = require('./VertexAtlas');
    let Shaders = require('./Shaders');
    let Shapes = require('./Shapes');

    let TILE_SIZE = 256;
    let NUM_SLICES = 64;
    let POINT_RADIUS = 2;

    let OFFSETS_INDEX = 1;

    function encodePoint(arraybuffer, index, x, y) {
        arraybuffer[index] = x >> 16;
        arraybuffer[index+1] = x & 0x0000FFFF;
        arraybuffer[index+2] = y >> 16;
        arraybuffer[index+3] = y & 0x0000FFFF;
    }

    let Cluster = WebGL.extend({

        options: {
            outlineWidth: 1,
            outlineColor: [0.0, 0.0, 0.0, 1.0],
            fillColor: [0.2, 0.15, 0.4, 0.5],
            radius: POINT_RADIUS,
            blending: true
        },

        onWebGLInit: function(done) {
            // ensure we use the correct context
            esper.WebGLContext.bind(this._container);
            // get the extension for hardware instancing
            this._ext = esper.WebGLContext.getExtension('ANGLE_instanced_arrays');
            if (!this._ext) {
                throw 'ANGLE_instanced_arrays WebGL extension is not supported';
            }
            // create the circle vertexbuffer
            this._circleFillBuffer = Shapes.circle.fill(NUM_SLICES);
            this._circleOutlineBuffer = Shapes.circle.outline(NUM_SLICES);
            // vertex atlas for all tiles
            this._atlas = new VertexAtlas();
            // load shader
            this._shader = new esper.Shader({
                vert: Shaders.instancedPoint.vert,
                frag: Shaders.instancedPoint.frag
            }, err => {
                if (err) {
                    done(err);
                }
                done(null);
            });
        },

        onCacheLoad: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            let zoom = coords.z;
            let size = Math.pow(2, zoom);
            let data = new Float64Array(cached.data);
            let positions = new Uint16Array(data.length * 4);
            let resolution = Math.sqrt(data.length);
            let pixelExtent = TILE_SIZE / resolution;
            let bin, i;
            let numPoints = 0;
            for (i=0; i<data.length; i++) {
                bin = data[i];
                if (bin > 0) {
                    let x = ((i % resolution) * pixelExtent) + (coords.x * TILE_SIZE);
                    let y = (Math.floor(i / resolution) * pixelExtent) + (coords.y * TILE_SIZE);
                    // encode the point into the buffer
                    encodePoint(
                        positions,
                        numPoints*4,
                        x,
                        (size * TILE_SIZE) - y);
                    // increment point count
                    numPoints++;
                }
            }
            cached.numPoints = numPoints;
            if (numPoints > 0) {
                let ncoords = this.getNormalizedCoords(coords);
                let hash = this.cacheKeyFromCoord(ncoords);
                this._atlas.addTile(hash, positions, numPoints);
            }
        },

        onCacheUnload: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            if (cached.numPoints > 0) {
                cached.numPoints = 0;
                let ncoords = this.getNormalizedCoords(coords);
                let hash = this.cacheKeyFromCoord(ncoords);
                this._atlas.removeTile(hash);
            }
        },

        drawInstanced: function(buffer, color, radius) {
            let gl = this._gl;
            let ext = this._ext;
            let shader = this._shader;
            let cache = this._cache;
            let zoom = this._map.getZoom();
            if (this.options.blending) {
                // enable blending
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            }
            // use shader
            shader.use();
            // set uniforms
            shader.setUniform('uColor', color);
            shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            shader.setUniform('uOpacity', this.getOpacity());
            shader.setUniform('uScale', radius);
            // calc view offset
            let viewOffset = this.getViewOffset();
            // binds the buffer to instance
            buffer.bind();
            // enable instancing
            ext.vertexAttribDivisorANGLE(OFFSETS_INDEX, 1);
            // for each allocated chunk
            this._atlas.forEach((chunk, hash) => {
                // for each tile referring to the data
                let cached = cache[hash];
                if (cached) {
                    // bind the chunk's buffer
                    chunk.vertexBuffer.bind();
                    // render for each tile
                    _.keys(cached.tiles).forEach(hash => {
                        let coords = this.coordFromCacheKey(hash);
                        if (coords.z !== zoom) {
                            // NOTE: we have to check here if the tiles are stale or not
                            return;
                        }
                        // upload view offset
                        let offset = this.getWrapAroundOffset(coords);
                        let totalOffset = [
                            viewOffset[0] - offset[0],
                            viewOffset[1] - offset[1],
                        ];
                        shader.setUniform('uViewOffset', totalOffset);
                        // draw the istances
                        ext.drawArraysInstancedANGLE(
                            gl[buffer.mode],
                            0,
                            buffer.count,
                            chunk.count);
                    });
                    // unbind
                    chunk.vertexBuffer.unbind();
                }
            });
            // disable instancing
            ext.vertexAttribDivisorANGLE(OFFSETS_INDEX, 0);
            // unbind buffer
            buffer.unbind();
        },

        renderFrame: function() {
            // setup
            let gl = this._gl;
            let viewport = this._viewport;
            viewport.push();
            // draw instanced fill
            this.drawInstanced(
                this._circleFillBuffer,
                this.options.fillColor,
                this.options.radius);
            // draw instanced outlines
            gl.lineWidth(this.options.outlineWidth);
            this.drawInstanced(
                this._circleOutlineBuffer,
                this.options.outlineColor,
                this.options.radius);
            // teardown
            viewport.pop();
        }

    });

    module.exports = Cluster;

}());
