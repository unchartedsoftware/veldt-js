(function() {

    'use strict';

    var esper = require('esper');
    var Overlay = require('./Overlay');

    var WebGL = Overlay.extend({

        onAdd: function(map) {
            Overlay.prototype.onAdd.call(this, map);
            map.on('zoomstart', this.onZoomStart, this);
            map.on('zoomend', this.onZoomEnd, this);
        },

        onRemove: function(map) {
            Overlay.prototype.onRemove.call(this, map);
            map.off('zoomstart', this.onZoomStart, this);
            map.off('zoomend', this.onZoomEnd, this);
        },

        onZoomStart: function() {
            this._isZooming = true;
        },

        onZoomEnd: function() {
            this._isZooming = false;
            this._renderFrame();
        },

        onCacheHit: function() {
            // no-op
        },

        onCacheLoad: function(tile, cached, coords) {
            if (cached.data) {
                this._bufferTileTexture(cached, coords);
            }
        },

        onCacheLoadExtremaUpdate: function() {
            var self = this;
            _.forIn(this._cache, function(cached) {
                if (cached.data) {
                    self._bufferTileTexture(cached);
                }
            });
        },

    	_initContainer: function () {
            Overlay.prototype._initContainer.call(this);
            if (!this._gl) {
                this._initGL();
            }
    	},

        _initGL: function() {
            var self = this;
            var gl = this._gl = esper.WebGLContext.get(this._container);
            // handle missing context
            if (!gl) {
                throw 'Unable to acquire a WebGL context';
            }
            // init the webgl state
            gl.clearColor(0, 0, 0, 0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.disable(gl.DEPTH_TEST);
            // create tile renderable
            self._renderable = new esper.Renderable({
                vertices: {
                    0: [
                        [0, -256],
                        [256, -256],
                        [256, 0],
                        [0, 0]
                    ],
                    1: [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1]
                    ]
                },
                indices: [
                    0, 1, 2,
                    0, 2, 3
                ]
            });
            // load shaders
            new esper.Shader({
                vert: this.options.shaders.vert,
                frag: this.options.shaders.frag
            }, function(err, shader) {
                if (err) {
                    console.error(err);
                    return;
                }
                // execute callback
                var width = self._container.width;
                var height = self._container.height;
                self._viewport = new esper.Viewport({
                    width: width,
                    height: height
                });
                self._initialized = true;
                self._shader = shader;
                self._draw();
            });
        },

        _getTranslationMatrix: function(x, y, z) {
            var mat = new Float32Array(16);
            mat[0] = 1;
            mat[1] = 0;
            mat[2] = 0;
            mat[3] = 0;
            mat[4] = 0;
            mat[5] = 1;
            mat[6] = 0;
            mat[7] = 0;
            mat[8] = 0;
            mat[9] = 0;
            mat[10] = 1;
            mat[11] = 0;
            mat[12] = x;
            mat[13] = y;
            mat[14] = z;
            mat[15] = 1;
            return mat;
        },

        _getOrthoMatrix: function(left, right, bottom, top, near, far) {
            var mat = new Float32Array(16);
            mat[0] = 2 / (right - left);
            mat[1] = 0;
            mat[2] = 0;
            mat[3] = 0;
            mat[4] = 0;
            mat[5] = 2 / (top - bottom);
            mat[6] = 0;
            mat[7] = 0;
            mat[8] = 0;
            mat[9] = 0;
            mat[10] = -2 / (far - near);
            mat[11] = 0;
            mat[12] = -((right + left) / (right - left));
            mat[13] = -((top + bottom) / (top - bottom));
            mat[14] = -((far + near) / (far - near));
            mat[15] = 1;
            return mat;
        },

        _getProjection: function() {
            var bounds = this._map.getPixelBounds();
            var dim = Math.pow(2, this._map.getZoom()) * 256;
            return this._getOrthoMatrix(
                bounds.min.x,
                bounds.max.x,
                (dim - bounds.max.y),
                (dim - bounds.min.y),
                -1, 1);
        },

        _draw: function() {
            if (this._initialized) {
                if (!this.isHidden()) {
                    // re-position canvas
                    if (!this._isZooming) {
                        // dfarw the frame
                        this._renderFrame();
                    }
                }
                requestAnimationFrame(this._draw.bind(this));
            }
        },

        _renderFrame: function() {
            var size = this._map.getSize();
            // set canvas size
            this._container.width = size.x;
            this._container.height = size.y;
            // set viewport size
            this._viewport.resize(size.x, size.y);
            // re-position container
            var topLeft = this._map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(this._container, topLeft);
            // setup
            var gl = this._gl;
            this._viewport.push();
            this._shader.push();
            this._shader.setUniform('uProjectionMatrix', this._getProjection());
            this._shader.setUniform('uOpacity', this.getOpacity());
            this._shader.setUniform('uTextureSampler', 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            // draw
            this._renderTiles();
            // teardown
            this._shader.pop();
            this._viewport.pop();
        },

        _renderTiles: function() {
            var self = this;
            var dim = Math.pow(2, this._map.getZoom()) * 256;
            // for each tile
            _.forIn(this._cache, function(cached) {
                if (!cached.texture) {
                    return;
                }
                // bind tile texture to texture unit 0
                cached.texture.push(0);
                _.forIn(cached.tiles, function(tile, key) {
                    // find the tiles position from its key
                    var coord = self.coordFromCacheKey(key);
                    // create model matrix
                    var model = self._getTranslationMatrix(
                        256 * coord.x,
                        dim - (256 * coord.y),
                        0);
                    self._shader.setUniform('uModelMatrix', model);
                    // draw the tile
                    self._renderable.draw();
                });
                // no need to unbind texture
            });
        },

        _bufferTileTexture: function(cached) {
            var data = new Float64Array(cached.data);
            var resolution = Math.sqrt(data.length);
            var buffer = new ArrayBuffer(data.length * 4);
            var bins = new Uint8Array(buffer);
            var color = [0, 0, 0, 0];
            var nval, rval, bin, i;
            var ramp = this.getColorRamp();
            var self = this;
            for (i=0; i<data.length; i++) {
                bin = data[i];
                if (bin === 0) {
                    color[0] = 0;
                    color[1] = 0;
                    color[2] = 0;
                    color[3] = 0;
                } else {
                    nval = self.transformValue(bin);
                    rval = self.interpolateToRange(nval);
                    ramp(rval, color);
                }
                bins[i * 4] = color[0];
                bins[i * 4 + 1] = color[1];
                bins[i * 4 + 2] = color[2];
                bins[i * 4 + 3] = color[3];
            }
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

    });

    module.exports = WebGL;

}());
