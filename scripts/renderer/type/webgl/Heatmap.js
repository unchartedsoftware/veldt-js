(function() {

    'use strict';

    var WebGL = require('../../core/WebGL');

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

        options: {
            shaders: {
                vert: vert,
                frag: frag,
            }
        }

    });

    module.exports = Heatmap;

}());
