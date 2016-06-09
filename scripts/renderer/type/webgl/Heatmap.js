(function() {

    'use strict';

    var esper = require('esper');
    var WebGL = require('../../core/WebGL');
    var ColorRamp = require('../../mixin/ColorRamp');
    var ValueTransform = require('../../mixin/ValueTransform');

    var vert = [
        'precision highp float;',
        'attribute vec2 aPosition;',
        'attribute vec2 aTextureCoord;',
        'uniform mat4 uProjectionMatrix;',
        'uniform mat4 uModelMatrix;',
        'varying vec2 vTextureCoord;',
        'void main() {',
            'vTextureCoord = aTextureCoord;',
            'gl_Position = uProjectionMatrix * uModelMatrix * vec4( aPosition, 0.0, 1.0 );',
        '}'
    ].join('');

    var frag = [
        'precision highp float;',
        'uniform sampler2D uTextureSampler;',
        'uniform float uOpacity;',
        'varying vec2 vTextureCoord;',
        'void main() {',
            'vec4 color = texture2D(uTextureSampler, vTextureCoord);',
            'gl_FragColor = vec4(color.rgb, color.a * uOpacity);',
        '}'
    ].join('');

    var Heatmap = WebGL.extend({

        includes: [
            // mixins
            ColorRamp,
            ValueTransform
        ],

        options: {
            shaders: {
                vert: vert,
                frag: frag,
            }
        },

        onWebGLInit: function() {
            // create tile renderable
            this._renderable = new esper.Renderable({
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
        },

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
        },

        onCacheLoad: function(tile, cached, coords) {
            if (cached.data) {
                this.bufferTileTexture(cached, coords);
            }
        },

        onCacheLoadExtremaUpdate: function() {
            var self = this;
            _.forIn(this._cache, function(cached) {
                if (cached.data) {
                    self.bufferTileTexture(cached);
                }
            });
        },

        bufferTileTexture: function(cached) {
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
            // ensure we use the correct context
            esper.WebGLContext.bind(this._container);
            // create the texture
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
        },

        renderTiles: function() {
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
                    var model = self.getTranslationMatrix(
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

        renderFrame: function() {
            // setup
            var gl = this._gl;
            this._viewport.push();
            this._shader.push();
            this._shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            this._shader.setUniform('uOpacity', this.getOpacity());
            this._shader.setUniform('uTextureSampler', 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            // draw
            this.renderTiles();
            // teardown
            this._shader.pop();
            this._viewport.pop();
        }

    });

    module.exports = Heatmap;

}());
