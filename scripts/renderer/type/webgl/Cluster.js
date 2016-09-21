(function() {

    'use strict';

    let esper = require('esper');
    let WebGL = require('../../core/WebGL');
    let Shaders = require('./Shaders');

    let TILE_SIZE = 256;
    let COMPONENT_BYTE_SIZE = 2;
    let COMPONENTS_PER_POINT = 4; // encoding two uint32's across xy/zw
    let MAX_TILES = 128;
    let MAX_POINTS_PER_TILE = 256 * 256;
    let MAX_TILE_BYTE_SIZE = MAX_POINTS_PER_TILE * COMPONENTS_PER_POINT * COMPONENT_BYTE_SIZE;
    let MAX_BUFFER_BYTE_SIZE = MAX_TILES * MAX_TILE_BYTE_SIZE;

    let NUM_SLICES = 64;
    let POINT_RADIUS = 2;

    let POSITIONS_INDEX = 0;
    let OFFSETS_INDEX = 1;

    function encodePoint(arraybuffer, index, x, y) {
        arraybuffer[index] = x >> 16;
        arraybuffer[index+1] = x & 0x0000FFFF;
        arraybuffer[index+2] = y >> 16;
        arraybuffer[index+3] = y & 0x0000FFFF;
    }

    function createCircleOutlineBuffer(numSegments) {
        let theta = (2 * Math.PI) / numSegments;
        let radius = 1.0;
        // precalculate sine and cosine
        let c = Math.cos(theta);
        let s = Math.sin(theta);
        let t;
        // start at angle = 0
        let x = radius;
        let y = 0;
        let positions = new Float32Array(numSegments * 2);
        for(let i = 0; i < numSegments; i++) {
            positions[i*2] = x;
            positions[i*2+1] = y;
            // apply the rotation
            t = x;
            x = c * x - s * y;
            y = s * t + c * y;
        }
        let pointers = {};
        pointers[POSITIONS_INDEX] = {
            size: 2,
            type: 'FLOAT'
        };
        let options = {
            mode: 'LINE_LOOP',
            count: positions.length / 2
        };
        return new esper.VertexBuffer(positions, pointers, options);
    }

    function createCircleFillBuffer(numSegments) {
        let theta = (2 * Math.PI) / numSegments;
        let radius = 1.0;
        // precalculate sine and cosine
        let c = Math.cos(theta);
        let s = Math.sin(theta);
        let t;
        // start at angle = 0
        let x = radius;
        let y = 0;
        let positions = new Float32Array((numSegments + 2) * 2);
        positions[0] = 0;
        positions[1] = 0;
        positions[positions.length-2] = radius;
        positions[positions.length-1] = 0;
        for(let i = 0; i < numSegments; i++) {
            positions[(i+1)*2] = x;
            positions[(i+1)*2+1] = y;
            // apply the rotation
            t = x;
            x = c * x - s * y;
            y = s * t + c * y;
        }

        let pointers = {};
        pointers[POSITIONS_INDEX] = {
            size: 2,
            type: 'FLOAT'
        };
        let options = {
            mode: 'TRIANGLE_FAN',
            count: positions.length / 2
        };
        return new esper.VertexBuffer(positions, pointers, options);
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
            // create the circle vertexbuffer
            this._circleFillBuffer = createCircleFillBuffer(NUM_SLICES);
            this._circleOutlineBuffer = createCircleOutlineBuffer(NUM_SLICES);
            // create the root offset buffer
            this._offsetBuffer = new esper.VertexBuffer(MAX_BUFFER_BYTE_SIZE);
            // get the extension for hardware instancing
            this._ext = esper.WebGLContext.getExtension('ANGLE_instanced_arrays');
            if (!this._ext) {
                throw 'ANGLE_instanced_arrays WebGL extension is not supported';
            }
            // init the chunks
            this.initChunks();
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

        initChunks: function() {
            // ensure we use the correct context
            esper.WebGLContext.bind(this._container);
            // allocate available chunks
            this._availableChunks = new Array(MAX_TILES);
            for (let i=0; i<MAX_TILES; i++) {
                let byteOffset = i * MAX_TILE_BYTE_SIZE;
                this._availableChunks[i] = {
                    byteOffset: byteOffset,
                    count: 0,
                    vertexBuffer: new esper.VertexBuffer(
                        this._offsetBuffer.buffer,
                        {
                            1: {
                                size: 4,
                                type: 'UNSIGNED_SHORT',
                                byteOffset: byteOffset
                            }
                        }, {
                            mode: 'POINTS',
                            byteLength: MAX_BUFFER_BYTE_SIZE
                        })
                };
            }
            this._usedChunks = {};
        },

        addTileToBuffer: function(coords, data, count) {
            if (this._availableChunks.length === 0) {
                console.warn('No available chunks remaining to buffer data');
                return;
            }
            // get an available chunk
            let chunk = this._availableChunks.pop();
            // set count
            chunk.count = count;
            // buffer the data into the physical chunk
            this._offsetBuffer.bufferSubData(data, chunk.byteOffset);
            // flag as used
            let ncoords = this.getNormalizedCoords(coords);
            let hash = this.cacheKeyFromCoord(ncoords);
            this._usedChunks[hash] = chunk;
        },

        removeTileFromBuffer: function(coords) {
            let ncoords = this.getNormalizedCoords(coords);
            let hash = this.cacheKeyFromCoord(ncoords);
            let chunk = this._usedChunks[hash];
            // clear the count
            chunk.count = 0;
            delete this._usedChunks[hash];
            // add as a new available chunk
            this._availableChunks.push(chunk);
            // no need to actually unbuffer the data
        },

        onCacheLoad: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            let zoom = coords.z;
            let size = Math.pow(2, zoom);
            let data = new Float64Array(cached.data);
            let positions = new Uint16Array(data.length * 4);
            // let counts = new Uint16Array(data.length * 4);
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
                this.addTileToBuffer(coords, positions, numPoints);
            }
        },

        onCacheUnload: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            if (cached.numPoints > 0) {
                cached.numPoints = 0;
                this.removeTileFromBuffer(coords);
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
            _.forIn(this._usedChunks, (chunk, hash) => {
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
                        ext.drawArraysInstancedANGLE(gl[buffer.mode], 0, buffer.count, chunk.count);
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
