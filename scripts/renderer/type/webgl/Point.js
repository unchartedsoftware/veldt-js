(function() {

    'use strict';

    let esper = require('esper');
    let Async = require('async');
    let WebGL = require('../../core/WebGL');
    let SpatialHash = require('../../mixin/SpatialHash');
    let Shaders = require('./Shaders');

    let TILE_SIZE = 256;
    let COMPONENT_BYTE_SIZE = 2;
    let COMPONENTS_PER_POINT = 4; // encoding two uint32's across xy/zw
    let MAX_TILES = 128;
    let MAX_POINTS_PER_TILE = 256 * 256;
    let MAX_TILE_BYTE_SIZE = MAX_POINTS_PER_TILE * COMPONENTS_PER_POINT * COMPONENT_BYTE_SIZE;
    let MAX_BUFFER_BYTE_SIZE = MAX_TILES * MAX_TILE_BYTE_SIZE;

    let NUM_SLICES = 64;
    let POINT_RADIUS = 8;
    let POINT_RADIUS_INC = 2;

    let POSITIONS_INDEX = 0;
    let OFFSETS_INDEX = 1;

    function encodePoint(arraybuffer, index, x, y) {
        arraybuffer[index] = x >> 16;
        arraybuffer[index+1] = x & 0x0000FFFF;
        arraybuffer[index+2] = y >> 16;
        arraybuffer[index+3] = y & 0x0000FFFF;
    }

    function applyJitter(point, maxDist) {
        let angle = Math.random() * (Math.PI * 2);
        let dist = Math.random() * maxDist;
        point.x += Math.Floor(Math.cos(angle) * dist);
        point.y += Math.Floor(Math.sin(angle) * dist);
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

    let Point = WebGL.extend({

        includes: [
            // mixins
            SpatialHash
        ],

        options: {
            pointOutline: 1,
            pointOutlineColor: [0.0, 0.0, 0.0, 1.0],
            pointFillColor: [0.2, 0.15, 0.4, 0.5],
            pointRadius: POINT_RADIUS,
            selectedOutlineColor: [0.0, 0.0, 0.0, 1.0],
            selectedFillColor: [0.8, 0.4, 0.2, 0.5],
            selectedRadius: POINT_RADIUS + POINT_RADIUS_INC,
            highlightedOutlineColor: [0.0, 0.0, 0.0, 1.0],
            highlightedFillColor: [0.3, 0.25, 0.5, 0.5],
            highlightedRadius: POINT_RADIUS + POINT_RADIUS_INC,
            blending: true,
            jitter: true,
            jitterDistance: 10
        },

        initialize: function() {
            SpatialHash.initialize.apply(this, arguments);
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
            // clear the chunks
            this.initChunks();
            // load shaders
            Async.parallel({
                instanced: (done) => {
                    let shader = new esper.Shader({
                        vert: Shaders.instancedPoint.vert,
                        frag: Shaders.instancedPoint.frag
                    }, err => {
                        if (err) {
                            done(err, null);
                        }
                        done(null, shader);
                    });
                },
                individual: (done) => {
                    let shader = new esper.Shader({
                        vert: Shaders.point.vert,
                        frag: Shaders.point.frag
                    }, err => {
                        if (err) {
                            done(err, null);
                        }
                        done(null, shader);
                    });
                }
            }, (err, shaders) => {
                if (err) {
                    done(err);
                }
                this._instancedShader = shaders.instanced;
                this._individualShader = shaders.individual;
                done(null);
            });
        },

        getCollisionRadius: function() {
            return this.options.pointRadius + this.options.pointOutline;
        },

        onAdd: function(map) {
            WebGL.prototype.onAdd.call(this, map);
            map.on('zoomend', this.onZoomEnd, this);
        },

        onRemove: function(map) {
            WebGL.prototype.onRemove.call(this, map);
            map.off('zoomend', this.onZoomEnd, this);
        },

        onZoomStart: function() {
            this.clearHash();
            WebGL.prototype.onZoomStart.apply(this, arguments);
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

        onMouseMove: function(e) {
            let target = e.originalEvent.target;
            let layerPixel = this.getLayerPointFromEvent(e.originalEvent);
            let radius = this.getCollisionRadius();
            let zoom = this._map.getZoom();
            let collision = this.pick(layerPixel, radius, zoom);
            let size = Math.pow(2, zoom);
            if (collision) {
                // mimic mouseover / mouseout events
                if (this.highlighted) {
                    if (this.highlighted.value !== collision) {
                        // new collision
                        // execute mouseout for old
                        this.fire('mouseout', {
                            elem: target,
                            value: this.highlighted.value
                        });
                        // execute mouseover for new
                        this.fire('mouseover', {
                            elem: target,
                            value: collision
                        });
                    }
                } else {
                    // no previous collision, execute mouseover
                    this.fire('mouseover', {
                        elem: target,
                        value: collision
                    });
                }
                // use collision point to find tile
                let coord = this.getTileCoordFromLayerPoint(collision);
                let hash = this.cacheKeyFromCoord(coord);
                // flag as highlighted
                this.highlighted = {
                    tiles: this._cache[hash].tiles,
                    value: collision,
                    point: [
                        collision.x,
                        (size * TILE_SIZE) - collision.y
                    ]
                };
                // set cursor
                $(this._map._container).css('cursor', 'pointer');
                return;
            }
            // mouse out
            if (this.highlighted) {
                this.fire('mouseout', {
                    elem: target,
                    value: this.highlighted.value
                });
            }
            // clear highlighted flag
            this.highlighted = null;
        },

        onClick: function(e) {
            let target = e.originalEvent.target;
            let layerPixel = this.getLayerPointFromEvent(e.originalEvent);
            let radius = this.getCollisionRadius();
            let zoom = this._map.getZoom();
            let size = Math.pow(2, zoom);
            let collision = this.pick(layerPixel, radius, zoom);
            if (collision) {
                // use collision point to find tile
                let coord = this.getTileCoordFromLayerPoint(collision);
                let hash = this.cacheKeyFromCoord(coord);
                // flag as selected
                this.selected = {
                    tiles: this._cache[hash].tiles,
                    value: collision,
                    point: [
                        collision.x,
                        (size * TILE_SIZE) - collision.y
                    ]
                };
                this.fire('click', {
                    elem: target,
                    value: collision
                });
            } else {
                this.selected = null;
            }

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
            if (cached.data && cached.data.length > 0) {
                // convert x / y to tile pixels
                let data = cached.data;
                let xField = this.getXField();
                let yField = this.getYField();
                let zoom = coords.z;
                let size = Math.pow(2, zoom);
                let radius = this.getCollisionRadius();
                let numBytes = data.length * COMPONENT_BYTE_SIZE * COMPONENTS_PER_POINT;
                let buffer = new ArrayBuffer(Math.min(numBytes, MAX_TILE_BYTE_SIZE));
                let positions = new Uint16Array(buffer);
                let count = 0;
                let numDatum = Math.min(data.length, MAX_POINTS_PER_TILE);
                let points = [];
                let collisions = {};
                let i;
                // calc pixel locations
                for (i=0; i<numDatum; i++) {
                    let hit = data[i];
                    let x = _.get(hit, xField);
                    let y = _.get(hit, yField);
                    if (x !== undefined && y !== undefined) {
                        // get position in layer
                        let layerPoint = this.getLayerPointFromDataPoint(x, y, zoom);
                        // create pixel
                        let point = {
                            x: layerPoint.x,
                            y: layerPoint.y,
                            data: hit
                        };
                        let hash = point.x + ':' + point.y;
                        if (this.options.jitter) {
                            if (collisions[hash]) {
                                applyJitter(point, this.options.jitterDistance);
                            }
                            collisions[hash] = true;
                        }
                        // store point
                        points.push(point);

                        // encode the point into the buffer
                        encodePoint(
                            positions,
                            i*4,
                            point.x,
                            (size * TILE_SIZE) - point.y);

                        // add point to spatial hash
                        this.addPoint(point, radius, zoom);
                        // increment count
                        count++;
                    }
                }
                if (count > 0) {
                    // store points in the cache
                    cached.points = points;
                    // buffer the data
                    this.addTileToBuffer(coords, positions, count);
                }
            }
        },

        onCacheUnload: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            if (cached.points) { //cached.data && cached.data.length > 0) {
                this.removeTileFromBuffer(coords);
                let radius = this.getCollisionRadius();
                cached.points.forEach(point => {
                    this.removePoint(point, radius, coords.z);
                });
                cached.points = null;
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
            let shader = this._instancedShader;
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

        drawIndividual: function(buffer, color, radius, tiles, point) {
            // draw selected points
            let gl = this._gl;
            let shader = this._individualShader;
            let zoom = this._map.getZoom();
            // bind the buffer
            buffer.bind();
            // disable blending
            gl.disable(gl.BLEND);
            // use shader
            shader.use();
            // use uniform for offset
            shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            shader.setUniform('uOpacity', this.getOpacity());
            shader.setUniform('uScale', radius);
            // view offset
            let viewOffset = this.getViewOffset();
            _.forIn(tiles, tile => {
                if (tile.coords.z !== zoom) {
                    // NOTE: we have to check here if the tiles are stale or not
                    return;
                }
                // upload view offset
                let offset = this.getWrapAroundOffset(tile.coords);
                let totalOffset = [
                    viewOffset[0] - offset[0],
                    viewOffset[1] - offset[1],
                ];
                shader.setUniform('uViewOffset', totalOffset);
                shader.setUniform('uOffset', point);
                shader.setUniform('uColor', color);
                buffer.draw();
            });
            // unbind the buffer
            buffer.unbind();
        },

        renderFrame: function() {
            // setup
            let gl = this._gl;
            let viewport = this._viewport;
            viewport.push();

            // draw instanced points

            // draw instanced fill
            this.drawInstanced(
                this._circleFillBuffer,
                this.options.pointFillColor,
                this.options.pointRadius);
            // draw instanced outlines
            gl.lineWidth(this.options.pointOutline);
            this.drawInstanced(
                this._circleOutlineBuffer,
                this.options.pointOutlineColor,
                this.options.pointRadius);

            // draw individual points

            if (this.highlighted) {
                // draw individual fill
                this.drawIndividual(
                    this._circleFillBuffer,
                    this.options.highlightedFillColor,
                    this.options.highlightedRadius,
                    this.highlighted.tiles,
                    this.highlighted.point);
                // draw individual outline
                gl.lineWidth(this.options.pointOutline);
                this.drawIndividual(
                    this._circleOutlineBuffer,
                    this.options.highlightedOutlineColor,
                    this.options.highlightedRadius,
                    this.highlighted.tiles,
                    this.highlighted.point);
            }

            if (this.selected) {
                // draw individual fill
                this.drawIndividual(
                    this._circleFillBuffer,
                    this.options.selectedFillColor,
                    this.options.selectedRadius,
                    this.selected.tiles,
                    this.selected.point);
                // draw individual outline
                gl.lineWidth(this.options.pointOutline);
                this.drawIndividual(
                    this._circleOutlineBuffer,
                    this.options.selectedOutlineColor,
                    this.options.selectedRadius,
                    this.selected.tiles,
                    this.selected.point);
            }

            // teardown
            viewport.pop();
        }

    });

    module.exports = Point;

}());
