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
        'uniform vec2 uOffset;',
        'uniform int uUseUniform;',
        'uniform mat4 uModelMatrix;',
        'uniform mat4 uProjectionMatrix;',
        'void main() {',
            'vec2 modelPosition = (uUseUniform > 0) ? aPosition + uOffset : aPosition + aOffset;',
            'gl_Position = uProjectionMatrix * uModelMatrix * vec4( modelPosition, 0.0, 1.0 );',
        '}'
    ].join('');

    var frag = [
        'precision highp float;',
        'uniform float uOpacity;',
        'uniform vec4 uColor;',
        'void main() {',
            'gl_FragColor = vec4(uColor.rgb, uColor.a * uOpacity);',
        '}'
    ].join('');

    function createCircleOutlineBuffer(radius, num_segments) {
    	var theta = (2 * Math.PI) / num_segments;
        // precalculate sine and cosine
    	var c = Math.cos(theta);
    	var s = Math.sin(theta);
    	var t;
        // start at angle = 0
    	var x = radius;
    	var y = 0;
        var buffer = new ArrayBuffer(num_segments * 2 * COMPONENT_BYTE_SIZE);
        var positions = new Float32Array(buffer);
    	for(var i = 0; i < num_segments; i++) {
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

    function createCircleFillBuffer(radius, num_segments) {
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
            pointOutline: 1,
            pointOutlineColor: [0.0, 0.0, 0.0, 1.0],
            pointColor: [0.2, 0.15, 0.4, 0.5],
            selectedColor: [1.0, 0.0, 0.0, 1.0],
            pointRadius: 8
        },

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
            SpatialHash.initialize.apply(this, arguments);
        },

        onWebGLInit: function() {
            // create the circle vertexbuffer
            this._circleFillBuffer = createCircleFillBuffer(this.options.pointRadius, 32);
            this._circleOutlineBuffer = createCircleOutlineBuffer(this.options.pointRadius, 32);
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

        onZoomStart: function() {
            this.clearHash();
            WebGL.prototype.onZoomStart.apply(this, arguments);
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

        onMouseMove: function(e) {
            var canvas = e.originalEvent.target;
            var target = $(canvas);
            var layerPixel = this.getLayerPointFromEvent(e.originalEvent);
            var fullRadius = this.options.pointRadius + this.options.pointOutline;
            //
            var collision = this.pick(layerPixel, fullRadius);
            if (collision) {
                // set cursor
                $(this._map._container).css('cursor', 'pointer');
                if (!this.highlighted) {
                    // execute callback
                    if (this.options.handlers.mouseover) {
                        this.options.handlers.mouseover(target, collision);
                    }
                }
                // flag as highlighted
                this.highlighted = collision;
                // set cursor
                $(this._map._container).css('cursor', 'pointer');
                return;
            }
            // mouse out
            if (this.highlighted) {
                if (this.options.handlers.mouseout) {
                    this.options.handlers.mouseout(target, this.highlighted);
                }
            }
            // clear highlighted flag
            this.highlighted = null;
        },

        onClick: function(e) {
            // var canvas = e.originalEvent.target;
            // var target = $(canvas);
            // get layer coord
            var layerPixel = this.getLayerPointFromEvent(e.originalEvent);
            var coord = this.getTileCoordFromLayerPoint(layerPixel);
            var hash = this.cacheKeyFromCoord(coord);
            var fullRadius = this.options.pointRadius + this.options.pointOutline;
            //
            var collision = this.pick(layerPixel, fullRadius);

            if (collision) {
                console.log(collision);
                this.selected = {
                    tiles: this._cache[hash].tiles,
                    point: collision
                };
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
                var fullRadius = this.options.pointRadius + this.options.pointOutline;
                var numBytes = data.length * COMPONENT_BYTE_SIZE * COMPONENTS_PER_POINT;
                var buffer = new ArrayBuffer(Math.min(numBytes, MAX_TILE_BYTE_SIZE));
                var positions = new Float32Array(buffer);
                var count = 0;
                var numDatum = Math.min(data.length, MAX_POINTS_PER_TILE);
                var points = [];
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
                        // store point
                        points.push(point);
                        // add to underlying buffer
                        positions[i*2] = layerPoint.x;
                        positions[i*2 + 1] = (size * TILE_SIZE) - layerPoint.y;
                        // add point to spatial hash
                        this.addPoint(point, fullRadius, zoom);
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
                //
                var fullRadius = this.options.pointRadius + this.options.pointOutline;
                var self = this;
                cached.points.forEach(function(point) {
                    self.removePoint(point, fullRadius, coords.z);
                });
                cached.points = null;
            }
        },

        drawCircleFill: function() {
            var self = this;
            var gl = this._gl;
            var ext = this._ext;
            var shader = this._shader;
            var cache = this._cache;
            var fillBuffer = this._circleFillBuffer;
            var size = Math.pow(2, this._map.getZoom());
            // enable blending
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            // set fill color
            shader.setUniform('uColor', this.options.pointColor);
            shader.setUniform('uUseUniform', 0);
            // binds the circle buffer to instance
            fillBuffer.bind();
            // enable instancing
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
                    ext.drawArraysInstancedANGLE(gl[fillBuffer.mode], 0, fillBuffer.count, chunk.count);
                });
                // unbind
                chunk.vertexBuffer.unbind();
            });
            // disable instancing
            ext.vertexAttribDivisorANGLE(OFFSETS_INDEX, 0);
            // unbind circle buffer
            fillBuffer.unbind();
        },

        drawCircleOutline: function() {
            var self = this;
            var gl = this._gl;
            var ext = this._ext;
            var shader = this._shader;
            var cache = this._cache;
            var outlineBuffer = this._circleOutlineBuffer;
            var size = Math.pow(2, this._map.getZoom());
            // enable blending
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            // set line width
            gl.lineWidth(this.options.pointOutline);
            // set fill color
            shader.setUniform('uColor', this.options.pointOutlineColor);
            shader.setUniform('uUseUniform', 0);
            // binds the circle buffer to instance
            outlineBuffer.bind();
            // enable instancing
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
                    ext.drawArraysInstancedANGLE(gl[outlineBuffer.mode], 0, outlineBuffer.count, chunk.count);
                });
                // unbind
                chunk.vertexBuffer.unbind();
            });
            // disable instancing
            ext.vertexAttribDivisorANGLE(OFFSETS_INDEX, 0);
            // unbind circle buffer
            outlineBuffer.unbind();
        },

        drawSelectedFill: function() {
            var self = this;
            var gl = this._gl;
            var shader = this._shader;
            var size = Math.pow(2, this._map.getZoom());
            // draw selected points
            if (this.selected) {
                var fillBuffer = this._circleFillBuffer;
                // re-bind the circle buffer
                fillBuffer.bind();
                // disable blending
                gl.disable(gl.BLEND);
                // use uniform for offset
                shader.setUniform('uUseUniform', 1);
                var point = this.selected.point;
                _.forIn(this.selected.tiles, function(tile) {
                    var coords = tile.coords;
                    var xWrap = Math.floor(coords.x / size);
                    var yWrap = Math.floor(coords.y / size);
                    // calc the translation matrix
                    var model = self.getTranslationMatrix(
                        size * TILE_SIZE * xWrap,
                        size * TILE_SIZE * yWrap,
                        0);
                    // upload translation matrix
                    shader.setUniform('uModelMatrix', model);
                    shader.setUniform('uOffset', [point.x, (size * TILE_SIZE) - point.y]);
                    shader.setUniform('uColor', self.options.selectedColor);
                    fillBuffer.draw();
                });
                // unbind the circle buffer
                fillBuffer.unbind();
            }
        },

        drawSelectedOutline: function() {
            var self = this;
            var gl = this._gl;
            var shader = this._shader;
            var size = Math.pow(2, this._map.getZoom());
            // draw selected points
            if (this.selected) {
                var outlineBuffer = this._circleOutlineBuffer;
                // re-bind the circle buffer
                outlineBuffer.bind();
                // disable blending
                gl.disable(gl.BLEND);
                // use uniform for offset
                shader.setUniform('uUseUniform', 1);
                var point = this.selected.point;
                _.forIn(this.selected.tiles, function(tile) {
                    var coords = tile.coords;
                    var xWrap = Math.floor(coords.x / size);
                    var yWrap = Math.floor(coords.y / size);
                    // calc the translation matrix
                    var model = self.getTranslationMatrix(
                        size * TILE_SIZE * xWrap,
                        size * TILE_SIZE * yWrap,
                        0);
                    // upload translation matrix
                    shader.setUniform('uModelMatrix', model);
                    shader.setUniform('uOffset', [point.x, (size * TILE_SIZE) - point.y]);
                    shader.setUniform('uColor', self.options.pointOutlineColor);
                    outlineBuffer.draw();
                });
                // unbind the circle buffer
                outlineBuffer.unbind();
            }
        },

        renderFrame: function() {
            // setup
            var gl = this._gl;
            this._viewport.push();
            this._shader.push();

            gl.clear(gl.COLOR_BUFFER_BIT);

            this._shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            this._shader.setUniform('uOpacity', this.getOpacity());

            this.drawCircleFill();
            this.drawCircleOutline();

            this.drawSelectedFill();
            this.drawSelectedOutline();

            // teardown
            this._shader.pop();
            this._viewport.pop();
        }

    });

    module.exports = Point;

}());
