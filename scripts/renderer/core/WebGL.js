(function() {

    'use strict';

    let esper = require('esper');
    let Overlay = require('./Overlay');

    let WebGL = Overlay.extend({

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
            this.clearExtrema();
            this._isZooming = true;
        },

        onZoomEnd: function() {
            this._isZooming = false;
            if (this._initialized) {
                let gl = this._gl;
                gl.clear(gl.COLOR_BUFFER_BIT);
                this.renderFrame();
            }
        },

        _initContainer: function() {
            Overlay.prototype._initContainer.call(this);
            if (!this._gl) {
                this._initGL();
            } else {
                this._draw();
            }
            this._isZooming = false;
        },

        onWebGLInit: function(done) {
            done(null);
        },

        _initGL: function() {
            let gl = this._gl = esper.WebGLContext.get(this._container);
            // handle missing context
            if (!gl) {
                throw 'Unable to acquire a WebGL context';
            }
            // init the webgl state
            gl.clearColor(0, 0, 0, 0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.disable(gl.DEPTH_TEST);
            // get map size
            let size = this._map.getSize();
            let devicePixelRatio = window.devicePixelRatio;
            // set viewport size
            this._viewport = new esper.Viewport({
                width: size.x * devicePixelRatio,
                height: size.y * devicePixelRatio
            });
            // set canvas size
            this._gl.canvas.style.width = size.x + 'px';
            this._gl.canvas.style.height = size.y + 'px';
            // webgl init callback
            this.onWebGLInit(err => {
                if (err) {
                    console.error(err);
                    return;
                }
                // flag as ready
                this._initialized = true;
                // start draw loop
                this._draw();
            });
        },

        getTranslationMatrix: function(x, y, z) {
            let mat = new Float32Array(16);
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
            let mat = new Float32Array(16);
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

        _positionContainer: function() {
            let size = this._map.getSize();
            let devicePixelRatio = window.devicePixelRatio;
            // set viewport size
            this._viewport.resize(
                size.x * devicePixelRatio,
                size.y * devicePixelRatio);
            // set canvas size
            this._gl.canvas.style.width = size.x + 'px';
            this._gl.canvas.style.height = size.y + 'px';
            // re-position container
            let topLeft = this._map.containerPointToLayerPoint([0, 0]);
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
                        let gl = this._gl;
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
