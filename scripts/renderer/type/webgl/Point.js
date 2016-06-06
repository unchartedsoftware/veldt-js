(function() {

    'use strict';

    var esper = require('esper');
    var WebGL = require('../../core/WebGL');
    var ColorRamp = require('../../mixin/ColorRamp');
    var SpatialHash = require('../../mixin/SpatialHash');
    var ValueTransform = require('../../mixin/ValueTransform');

    var TILE_SIZE = 256;
    var COMPONENT_BYTE_SIZE = 4;
    var COMPONENTS_PER_POINT = 2;
    var MAX_TILES = 128;
    var MAX_POINTS_PER_TILE = 256 * 256;
    var MAX_TILE_BYTE_SIZE = MAX_POINTS_PER_TILE * COMPONENTS_PER_POINT * COMPONENT_BYTE_SIZE;
    var MAX_BUFFER_BYTE_SIZE = MAX_TILES * MAX_TILE_BYTE_SIZE;

    var POSITIONS_INDEX = 0;
    var OFFSETS_INDEX = 1;

    var vert = [
        'precision highp float;',
        'attribute vec2 aPosition;',
        'attribute vec2 aOffset;',
        'uniform mat4 uModelMatrix;',
        'uniform mat4 uProjectionMatrix;',
        'void main() {',
            'vec2 modelPosition = aPosition + aOffset;',
            'gl_Position = uProjectionMatrix * uModelMatrix * vec4( modelPosition, 0.0, 1.0 );',
        '}'
    ].join('');

    var frag = [
        'precision highp float;',
        'uniform float uOpacity;',
        'void main() {',
            'vec4 color = vec4(0.7, 0.3, 0.9, 1.0);',
            'gl_FragColor = vec4(color.rgb, color.a * uOpacity);',
        '}'
    ].join('');

    function createCircleBuffer(radius, num_segments) {
    	var theta = (2 * Math.PI) / num_segments;
        // precalculate sine and cosine
    	var c = Math.cos(theta);
    	var s = Math.sin(theta);
    	var t;
        // start at angle = 0
    	var x = radius;
    	var y = 0;
        var buffer = new ArrayBuffer((num_segments + 2) * 2 * COMPONENT_BYTE_SIZE);
        var positions = new Float32Array(buffer);
        positions[0] = 0;
        positions[1] = 0;
        positions[positions.length-2] = radius;
        positions[positions.length-1] = 0;
    	for(var i = 0; i < num_segments; i++) {
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
            ColorRamp,
            ValueTransform,
            SpatialHash
        ],

        options: {
            shaders: {
                vert: vert,
                frag: frag,
            },
            pointBorder: 1,
            pointRadius: 8
        },

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
            SpatialHash.initialize.apply(this, arguments);
        },

        onWebGLInit: function() {
            // create the circle vertexbuffer
            this._circleBuffer = createCircleBuffer(this.options.pointRadius, 64);
            // create the root offset buffer
            this._offsetBuffer = new esper.VertexBuffer(MAX_BUFFER_BYTE_SIZE);
            // get the extension for hardware instancing
            this._ext = esper.WebGLContext.getExtension('ANGLE_instanced_arrays');
            if (!this._ext) {
                throw 'ANGLE_instanced_arrays WebGL extension is not supported';
            }
            // clear the chunks
            this.clearChunks();
        },

        onAdd: function(map) {
            WebGL.prototype.onAdd.call(this, map);
            map.on('zoomend', this.onZoomEnd, this);
        },

        onRemove: function(map) {
            WebGL.prototype.onRemove.call(this, map);
            map.off('zoomend', this.onZoomEnd, this);
        },

        onZoomEnd: function() {
            this.clearHash();
            WebGL.prototype.onZoomEnd.apply(this, arguments);
        },

        clearChunks: function() {
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
            console.log('add', hash);
            this._usedChunks[hash] = chunk;
        },

        removeTileFromBuffer: function(coords) {
            var ncoords = this.getNormalizedCoords(coords);
            var hash = this.cacheKeyFromCoord(ncoords);
            console.log('remove', hash);
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
                var fullRadius = this.options.pointRadius + this.options.pointBorder;
                var numBytes = data.length * COMPONENT_BYTE_SIZE * COMPONENTS_PER_POINT;
                var buffer = new ArrayBuffer(Math.min(numBytes, MAX_TILE_BYTE_SIZE));
                var positions = new Float32Array(buffer);
                var count = 0;
                var numDatum = Math.min(data.length, MAX_POINTS_PER_TILE);
                var i;
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
                        // add to underlying buffer
                        positions[i*2] = layerPoint.x;
                        positions[i*2 + 1] = (size * TILE_SIZE) - layerPoint.y;
                        // add point to spatial hash
                        this.addPoint(point, fullRadius);
                        // increment count
                        count++;
                    }
                }
                // buffer the data
                this.addTileToBuffer(coords, positions, count);
            }
        },

        onCacheUnload: function(tile, cached, coords) {
            if (cached.data && cached.data.length > 0) {
                this.removeTileFromBuffer(coords);
            }
        },

        renderFrame: function() {
            // setup
            var gl = this._gl;
            this._viewport.push();
            this._shader.push();
            this._shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            this._shader.setUniform('uOpacity', this.getOpacity());
            gl.clear(gl.COLOR_BUFFER_BIT);
            // instance using the offsets
            var circleBuffer = this._circleBuffer;
            // binds the circle buffer to instance
            circleBuffer.bind();
            var ext = this._ext;
            var shader = this._shader;
            var cache = this._cache;
            var self = this;
            var size = Math.pow(2, this._map.getZoom());
            ext.vertexAttribDivisorANGLE(OFFSETS_INDEX, 1);
            _.forIn(this._usedChunks, function(chunk, hash) {
                // bind the chunk's buffer
                chunk.vertexBuffer.bind();
                // for each tile referring to the data
                var cached = cache[hash];
                _.keys(cached.tiles).forEach(function(hash) {
                    var coords = self.coordFromCacheKey(hash);
                    var xWrap = Math.floor(coords.x / size);
                    var yWrap = Math.floor(coords.y / size);
                    // calc the translation matrix
                    var model = self.getTranslationMatrix(
                        size * TILE_SIZE * xWrap,
                        size * TILE_SIZE * yWrap,
                        0);
                    // upload translation matrix
                    shader.setUniform('uModelMatrix', model);
                    // draw the istances
                    ext.drawArraysInstancedANGLE(gl.TRIANGLE_FAN, 0, circleBuffer.count, chunk.count);
                });
            });
            // teardown
            this._shader.pop();
            this._viewport.pop();
        }

    });

    module.exports = Point;

}());
