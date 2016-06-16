(function() {

    'use strict';

    module.exports = {

        /**
         * heatmap shader
         */

        heatmap: {
            vert: [
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
            ].join(''),
            frag: [
                'precision highp float;',
                'uniform sampler2D uTextureSampler;',
                'uniform float uOpacity;',
                'varying vec2 vTextureCoord;',
                'void main() {',
                    'vec4 color = texture2D(uTextureSampler, vTextureCoord);',
                    'gl_FragColor = vec4(color.rgb, color.a * uOpacity);',
                '}'
            ].join('')
        },

        /**
         * point shader
         */

        point: {
            vert: [
                'precision highp float;',
                'attribute vec2 aPosition;',
                'attribute vec2 aOffset;',
                'uniform vec2 uOffset;',
                'uniform float uScale;',
                'uniform int uUseUniform;',
                'uniform mat4 uModelMatrix;',
                'uniform mat4 uProjectionMatrix;',
                'void main() {',
                    'vec2 scaledPos = uScale * aPosition;',
                    'vec2 modelPosition = (uUseUniform > 0) ? scaledPos + uOffset : scaledPos + aOffset;',
                    'gl_Position = uProjectionMatrix * uModelMatrix * vec4( modelPosition, 0.0, 1.0 );',
                '}'
            ].join(''),
            frag: [
                'precision highp float;',
                'uniform float uOpacity;',
                'uniform vec4 uColor;',
                'void main() {',
                    'gl_FragColor = vec4(uColor.rgb, uColor.a * uOpacity);',
                '}'
            ].join('')
        },


    };

}());
