(function() {

    'use strict';

    var esper = require('esper');
    var Overlay = require('./Overlay');

    var TILE_SIZE = 256;

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
            var gl = this._gl;
            gl.clear(gl.COLOR_BUFFER_BIT);
            this.renderFrame();
        },

        _initContainer: function () {
            Overlay.prototype._initContainer.call(this);
            if (!this._gl) {
                this._initGL();
            } else {
                this._draw();
            }
        },

        onWebGLInit: function() {
            // impl
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
            // webgl init callback
            self.onWebGLInit();
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
                var size = self._map.getSize();
                var devicePixelRatio = window.devicePixelRatio;
                // set viewport size
                self._viewport = new esper.Viewport({
                    width: size.x * devicePixelRatio,
                    height: size.y * devicePixelRatio
                });
                // set canvas size
                self._gl.canvas.style.width = size.x + 'px';
                self._gl.canvas.style.height = size.y + 'px';
                // flag as ready
                self._initialized = true;
                self._shader = shader;
                self._draw();
            });
        },

        getTranslationMatrix: function(x, y, z) {
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

        getOrthoMatrix: function(left, right, bottom, top, near, far) {
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

        getProjectionMatrix: function() {
            var bounds = this._map.getPixelBounds();
            var dim = Math.pow(2, this._map.getZoom()) * TILE_SIZE;
            return this.getOrthoMatrix(
                bounds.min.x,
                bounds.max.x,
                (dim - bounds.max.y),
                (dim - bounds.min.y),
                -1, 1);
        },

        _positionContainer: function() {
            var size = this._map.getSize();
            var devicePixelRatio = window.devicePixelRatio;
            // set viewport size
            this._viewport.resize(
                size.x * devicePixelRatio,
                size.y * devicePixelRatio);
            // set canvas size
            this._gl.canvas.style.width = size.x + 'px';
            this._gl.canvas.style.height = size.y + 'px';
            // re-position container
            var topLeft = this._map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(this._container, topLeft);
        },

        _draw: function() {
            if (this._map && this._initialized) {
                if (!this.isHidden()) {
                    // re-position canvas
                    if (!this._isZooming) {
                        // position the container and resize viewport
                        this._positionContainer();
                        // clear buffer
                        var gl = this._gl;
                        gl.clear(gl.COLOR_BUFFER_BIT);
                        // draw the frame
                        this.renderFrame();
                    }
                }
                requestAnimationFrame(this._draw.bind(this));
            }
        },

        renderFrame: function() {
            // implement this
        }

    });

    module.exports = WebGL;

}());
