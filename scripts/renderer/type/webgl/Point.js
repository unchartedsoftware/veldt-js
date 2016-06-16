(function() {

    'use strict';

    var esper = require('esper');
    var WebGL = require('../../core/WebGL');
    var SpatialHash = require('../../mixin/SpatialHash');
    var Shaders = require('./Shaders');

    var TILE_SIZE = 256;
    var COMPONENT_BYTE_SIZE = 4;
    var COMPONENTS_PER_POINT = 2;
    var MAX_TILES = 128;
    var MAX_POINTS_PER_TILE = 256 * 256;
    var MAX_TILE_BYTE_SIZE = MAX_POINTS_PER_TILE * COMPONENTS_PER_POINT * COMPONENT_BYTE_SIZE;
    var MAX_BUFFER_BYTE_SIZE = MAX_TILES * MAX_TILE_BYTE_SIZE;

    var NUM_SLICES = 64;
    var POINT_RADIUS = 8;
    var POINT_RADIUS_INC = 2;

    var POSITIONS_INDEX = 0;
    var OFFSETS_INDEX = 1;

    function applyJitter(point, maxDist) {
        var angle = Math.random() * (Math.PI * 2);
        var dist = Math.random() * maxDist;
        point.x += Math.cos(angle) * dist;
        point.y += Math.sin(angle) * dist;
    }

    function createCircleOutlineBuffer(numSegments) {
        var theta = (2 * Math.PI) / numSegments;
        var radius = 1.0;
        // precalculate sine and cosine
        var c = Math.cos(theta);
        var s = Math.sin(theta);
        var t;
        // start at angle = 0
        var x = radius;
        var y = 0;
        var buffer = new ArrayBuffer(numSegments * 2 * COMPONENT_BYTE_SIZE);
        var positions = new Float32Array(buffer);
        for(var i = 0; i < numSegments; i++) {
            positions[i*2] = x;
            positions[i*2+1] = y;
            // apply the rotation
            t = x;
            x = c * x - s * y;
            y = s * t + c * y;
        }
        var pointers = {};
        pointers[POSITIONS_INDEX] = {
            size: 2,
            type: 'FLOAT'
        };
        var options = {
            mode: 'LINE_LOOP'
        };
        return new esper.VertexBuffer(positions, pointers, options);
    }

    function createCircleFillBuffer(numSegments) {
        var theta = (2 * Math.PI) / numSegments;
        var radius = 1.0;
        // precalculate sine and cosine
        var c = Math.cos(theta);
        var s = Math.sin(theta);
        var t;
        // start at angle = 0
        var x = radius;
        var y = 0;
        var buffer = new ArrayBuffer((numSegments + 2) * 2 * COMPONENT_BYTE_SIZE);
        var positions = new Float32Array(buffer);
        positions[0] = 0;
        positions[1] = 0;
        positions[positions.length-2] = radius;
        positions[positions.length-1] = 0;
        for(var i = 0; i < numSegments; i++) {
            positions[(i+1)*2] = x;
            positions[(i+1)*2+1] = y;
            // apply the rotation
            t = x;
            x = c * x - s * y;
            y = s * t + c * y;
        }

        var pointers = {};
        pointers[POSITIONS_INDEX] = {
            size: 2,
            type: 'FLOAT'
        };
        var options = {
            mode: 'TRIANGLE_FAN'
        };
        return new esper.VertexBuffer(positions, pointers, options);
    }

    var Point = WebGL.extend({

        includes: [
            // mixins
            SpatialHash
        ],

        options: {
            shaders: Shaders.point,
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
            jitter: true,
            jitterDistance: 10
        },

        initialize: function() {
            SpatialHash.initialize.apply(this, arguments);
        },

        onWebGLInit: function() {
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
            this._availableChunks = new Array(MAX_TILES);
            for (var i=0; i<MAX_TILES; i++) {
                var byteOffset = i * MAX_TILE_BYTE_SIZE;
                this._availableChunks[i] = {
                    byteOffset: byteOffset,
                    count: 0,
                    vertexBuffer: new esper.VertexBuffer(
                        this._offsetBuffer.buffer,
                        {
                            1: {
                                size: 2,
                                type: 'FLOAT',
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
            var canvas = e.originalEvent.target;
            var target = $(canvas);
            var layerPixel = this.getLayerPointFromEvent(e.originalEvent);
            var radius = this.getCollisionRadius();
            var collision = this.pick(layerPixel, radius);
            var coord = this.getTileCoordFromLayerPoint(layerPixel);
            var hash = this.cacheKeyFromCoord(coord);
            var size = Math.pow(2, this._map.getZoom());
            if (collision) {
                // mimic mouseover / mouseout events
                if (this.highlighted) {
                    if (this.highlighted.value !== collision) {
                        // new collision
                        // execute mouseout for old
                        if (this.options.handlers.mouseout) {
                            this.options.handlers.mouseout(target, this.highlighted.value);
                        }
                        // execute mouseover for new
                        if (this.options.handlers.mouseover) {
                            this.options.handlers.mouseover(target, collision);
                        }
                    }
                } else {
                    // no previous collision, execute mouseover
                    if (this.options.handlers.mouseover) {
                        this.options.handlers.mouseover(target, collision);
                    }
                }
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
                if (this.options.handlers.mouseout) {
                    this.options.handlers.mouseout(target, this.highlighted.value);
                }
            }
            // clear highlighted flag
            this.highlighted = null;
        },

        onClick: function(e) {
            var canvas = e.originalEvent.target;
             var target = $(canvas);
            var layerPixel = this.getLayerPointFromEvent(e.originalEvent);
            var coord = this.getTileCoordFromLayerPoint(layerPixel);
            var hash = this.cacheKeyFromCoord(coord);
            var radius = this.getCollisionRadius();
            var size = Math.pow(2, this._map.getZoom());
            var collision = this.pick(layerPixel, radius);
            if (collision) {
                this.selected = {
                    tiles: this._cache[hash].tiles,
                    value: collision,
                    point: [
                        collision.x,
                        (size * TILE_SIZE) - collision.y
                    ]
                };
                if (this.options.handlers.click) {
                    this.options.handlers.click(target, collision);
                }
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
            var chunk = this._availableChunks.pop();
            // set count
            chunk.count = count;
            // buffer the data into the physical chunk
            this._offsetBuffer.bufferSubData(data, chunk.byteOffset);
            // flag as used
            var ncoords = this.getNormalizedCoords(coords);
            var hash = this.cacheKeyFromCoord(ncoords);
            this._usedChunks[hash] = chunk;
        },

        removeTileFromBuffer: function(coords) {
            var ncoords = this.getNormalizedCoords(coords);
            var hash = this.cacheKeyFromCoord(ncoords);
            var chunk = this._usedChunks[hash];
            // clear the count
            chunk.count = 0;
            delete this._usedChunks[hash];
            // add as a new available chunk
            this._availableChunks.push(chunk);
            // no need to actually unbuffer the data
        },

        onCacheLoad: function(tile, cached, coords) {
            if (cached.data && cached.data.length > 0) {
                // convert x / y to tile pixels
                var data = cached.data;
                var xField = this.getXField();
                var yField = this.getYField();
                var zoom = coords.z;
                var size = Math.pow(2, zoom);
                var radius = this.getCollisionRadius();
                var numBytes = data.length * COMPONENT_BYTE_SIZE * COMPONENTS_PER_POINT;
                var buffer = new ArrayBuffer(Math.min(numBytes, MAX_TILE_BYTE_SIZE));
                var positions = new Float32Array(buffer);
                var count = 0;
                var numDatum = Math.min(data.length, MAX_POINTS_PER_TILE);
                var points = [];
                var i;
                var collisions = {};
                // calc pixel locations
                for (i=0; i<numDatum; i++) {
                    var hit = data[i];
                    var x = _.get(hit, xField);
                    var y = _.get(hit, yField);
                    if (x !== undefined && y !== undefined) {
                        // get position in layer
                        var layerPoint = this.getLayerPointFromDataPoint(x, y, zoom);
                        // create pixel
                        var point = {
                            x: layerPoint.x,
                            y: layerPoint.y,
                            data: hit
                        };
                        var hash = point.x + ':' + point.y;
                        if (this.options.jitter) {
                            if (collisions[hash]) {
                                applyJitter(point, this.options.jitterDistance);
                            }
                            collisions[hash] = true;
                        }
                        // store point
                        points.push(point);
                        // add to underlying buffer
                        positions[i*2] = point.x;
                        positions[i*2 + 1] = (size * TILE_SIZE) - point.y;
                        // add point to spatial hash
                        this.addPoint(point, radius, zoom);
                        // increment count
                        count++;
                    }
                }
                // store points in the cache
                cached.points = points;
                // buffer the data
                this.addTileToBuffer(coords, positions, count);
            }
        },

        onCacheUnload: function(tile, cached, coords) {
            if (cached.data && cached.data.length > 0) {
                this.removeTileFromBuffer(coords);
                var radius = this.getCollisionRadius();
                var self = this;
                cached.points.forEach(function(point) {
                    self.removePoint(point, radius, coords.z);
                });
                cached.points = null;
            }
        },

        getModelMatrix: function(coords) {
            var size = Math.pow(2, this._map.getZoom());
            var xWrap = Math.floor(coords.x / size);
            var yWrap = Math.floor(coords.y / size);
            return this.getTranslationMatrix(
                size * TILE_SIZE * xWrap,
                size * TILE_SIZE * yWrap,
                0);
        },

        drawInstanced: function(buffer, color, radius) {
            var self = this;
            var gl = this._gl;
            var ext = this._ext;
            var shader = this._shader;
            var cache = this._cache;
            // enable blending
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            // set fill color
            shader.setUniform('uColor', color);
            shader.setUniform('uUseUniform', 0);
            shader.setUniform('uScale', radius);
            // binds the buffer to instance
            buffer.bind();
            // enable instancing
            ext.vertexAttribDivisorANGLE(OFFSETS_INDEX, 1);
            // for each allocated chunk
            _.forIn(this._usedChunks, function(chunk, hash) {
                // bind the chunk's buffer
                chunk.vertexBuffer.bind();
                // for each tile referring to the data
                var cached = cache[hash];
                _.keys(cached.tiles).forEach(function(hash) {
                    var coords = self.coordFromCacheKey(hash);
                    // upload translation matrix
                    shader.setUniform('uModelMatrix', self.getModelMatrix(coords));
                    // draw the istances
                    ext.drawArraysInstancedANGLE(gl[buffer.mode], 0, buffer.count, chunk.count);
                });
                // unbind
                chunk.vertexBuffer.unbind();
            });
            // disable instancing
            ext.vertexAttribDivisorANGLE(OFFSETS_INDEX, 0);
            // unbind buffer
            buffer.unbind();
        },

        drawIndividual: function(buffer, color, radius, tiles, point) {
            // draw selected points
            var self = this;
            var gl = this._gl;
            var shader = this._shader;
            // bind the buffer
            buffer.bind();
            // disable blending
            gl.disable(gl.BLEND);
            // use uniform for offset
            shader.setUniform('uUseUniform', 1);
            shader.setUniform('uScale', radius);
            _.forIn(tiles, function(tile) {
                // upload translation matrix
                shader.setUniform('uModelMatrix', self.getModelMatrix(tile.coords));
                shader.setUniform('uOffset', point);
                shader.setUniform('uColor', color);
                buffer.draw();
            });
            // unbind the buffer
            buffer.unbind();
        },

        renderFrame: function() {
            // setup
            var gl = this._gl;
            var viewport = this._viewport;
            var shader = this._shader;
            viewport.push();
            shader.push();
            // set uniforms
            shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            shader.setUniform('uOpacity', this.getOpacity());

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
            shader.pop();
            viewport.pop();
        }

    });

    module.exports = Point;

}());
