(function() {

    'use strict';

    const ColorRamp = require('../../mixin/ColorRamp');

    /**
     * precision
     */
    const precision =
        `
        precision highp float;
        precision highp int;
        `;

    /**
     * decode float
     */
    const decodeRGBAToFloat =
        `
        float decodeRGBAToFloat(vec4 v) {
            return (v.x * 255.0 * 16777216.0) +
                (v.y * 255.0 * 65536.0) +
                (v.z * 255.0 * 256.0) +
                v.w * 255.0;
        }
        `;

    /**
     * transforms
     */

    // log10
    const log10Transform =
        `
        float log10(float val) {
            return log(val) / log(10.0);
        }
        float log10Transform(float val, float minVal, float maxVal) {
            if (minVal < 1.0) { minVal = 1.0; }
            if (maxVal < 1.0) { maxVal = 1.0; }
            if (val < 1.0) { val = 1.0; }
            float logMin = log10(minVal);
            float logMax = log10(maxVal);
            float logVal = log10(val);
            float range = logMax - logMin;
            if (range == 0.0) { range = 1.0; }
            return (logVal - logMin) / range;
        }
        `;

    // sigmoid
    const sigmoidTransform =
        `
        float sigmoidTransform(float val, float minVal, float maxVal) {
            minVal = abs(minVal);
            maxVal = abs(maxVal);
            float dist = max(minVal, maxVal);
            float SIGMOID_SCALE = 0.15;
            float scaledVal = val / (SIGMOID_SCALE * dist);
            return 1.0 / (1.0 + exp(-scaledVal));
        }
        `;

    // linear
    const linearTransform =
        `
        float linearTransform(float val, float minVal, float maxVal) {
            float range = maxVal - minVal;
            if (range == 0.0) { range = 1.0; }
            return (val - minVal) / range;
        }
        `;

    const transform =
        log10Transform +
        sigmoidTransform +
        linearTransform +
        `
        #define LOG_TRANSFORM 0
        #define LINEAR_TRANSFORM 1
        #define SIGMOID_TRANSFORM 2
        uniform int uTransformType;
        uniform float uMin;
        uniform float uMax;
        float transform(float val) {
            if (val < uMin) { val = uMin; }
            if (val > uMax) { val = uMax; }
            if (uTransformType == LINEAR_TRANSFORM) {
                return linearTransform(val, uMin, uMax);
            } else if (uTransformType == SIGMOID_TRANSFORM) {
                return sigmoidTransform(val, uMin, uMax);
            }
            return log10Transform(val, uMin, uMax);
        }
        `;

    /**
     * Color ramp
     */
    const colorRamp =
        `
        #define RAMP_VALUES ${ColorRamp.NUM_GRADIENT_STEPS}
        uniform vec4 uRamp[RAMP_VALUES];
        vec4 colorRamp(float value) {
            float maxIndex = float(RAMP_VALUES - 1);
            int index = int(value * maxIndex);
            // NOTE: I REALLY don't like this, but it seems to be the only way
            // to index the uRamp array
            for (int i=0; i<RAMP_VALUES; i++) {
                if (i == index) {
                    return uRamp[i];
                }
            }
            return vec4(1.0, 0.0, 1.0, 1.0);
        }
        `;

    /**
     * Value Range
     */
    const valueRange =
        `
        uniform float uRangeMin;
        uniform float uRangeMax;
        float interpolateToRange(float nval) {
            float rval = (nval - uRangeMin) / (uRangeMax - uRangeMin);
            if (rval > 1.0) {
                rval = 1.0;
            } else if (rval < 0.0) {
                rval = 0.0;
            }
            return rval;
        }
        `;

    /**
     * heatmap shader
     */
    const heatmap = {
        vert:
            precision +
            `
            attribute vec2 aPosition;
            attribute vec2 aTextureCoord;
            uniform mat4 uProjectionMatrix;
            uniform ivec2 uTileOffset;
            uniform vec2 uTextureCoordOffset;
            uniform vec2 uTextureCoordExtent;
            varying vec2 vTextureCoord;
            void main() {
                vTextureCoord = vec2(
                    uTextureCoordOffset.x + (aTextureCoord.x * uTextureCoordExtent.x),
                    uTextureCoordOffset.y + (aTextureCoord.y * uTextureCoordExtent.y));
                ivec2 wPosition = ivec2(aPosition) + uTileOffset;
                gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
            }
            `,
        frag:
            precision +
            decodeRGBAToFloat +
            transform +
            colorRamp +
            valueRange +
            `
            uniform sampler2D uTextureSampler;
            uniform float uOpacity;
            varying vec2 vTextureCoord;
            void main() {
                vec4 enc = texture2D(uTextureSampler, vTextureCoord);
                float count = decodeRGBAToFloat(enc);
                if (count == 0.0) {
                    discard;
                }
                float nval = transform(count);
                float rval = interpolateToRange(nval);
                vec4 color = colorRamp(rval);
                gl_FragColor = vec4(color.rgb, color.a * uOpacity);
            }
            `
    };

    /**
     * instanced point shader
     */
    const instancedPoint = {
        vert:
            precision +
            `
            attribute vec2 aPosition;
            attribute vec2 aOffset;
            uniform ivec2 uTileOffset;
            uniform float uRadius;
            uniform mat4 uProjectionMatrix;
            void main() {
                ivec2 iOffset = ivec2(aOffset);
                vec2 mPosition = (uRadius * aPosition) + vec2(iOffset + uTileOffset);
                gl_Position = uProjectionMatrix * vec4(mPosition, 0.0, 1.0);
            }
            `,
        frag:
            precision +
            `
            uniform float uOpacity;
            uniform vec4 uColor;
            void main() {
                gl_FragColor = vec4(uColor.rgb, uColor.a * uOpacity);
            }
            `
    };

    const point = {
        vert:
            precision +
            `
            attribute vec2 aPosition;
            uniform ivec2 uOffset;
            uniform ivec2 uTileOffset;
            uniform float uRadius;
            uniform mat4 uProjectionMatrix;
            void main() {
                vec2 mPosition = uRadius * aPosition + vec2(uOffset + uTileOffset);
                gl_Position = uProjectionMatrix * vec4(mPosition, 0.0, 1.0);
            }
            `,
        frag:
            precision +
            `
            uniform float uOpacity;
            uniform vec4 uColor;
            void main() {
                gl_FragColor = vec4(uColor.rgb, uColor.a * uOpacity);
            }
            `
    };

    /**
     * instanced ring shader
     */
    const instancedRing = {
        vert:
            precision +
            `
            attribute vec3 aPosition;
            attribute vec2 aOffset;
            attribute float aRadius;
            uniform ivec2 uTileOffset;
            uniform float uDegrees;
            uniform float uRadiusOffset;
            uniform mat4 uProjectionMatrix;
            uniform vec4 uColor;
            varying vec4 vColor;
            void main() {
                ivec2 iOffset = ivec2(aOffset);
                vec2 mPosition = (aPosition.xy + (normalize(aPosition.xy) * (aRadius - uRadiusOffset))) + vec2(iOffset + uTileOffset);
                if (aPosition.z > uDegrees) {
                    vColor = vec4(0.0, 0.0, 0.0, 0.0);
                } else {
                    vColor = uColor;
                }
                gl_Position = uProjectionMatrix * vec4(mPosition, 0.0, 1.0);
            }
            `,
        frag:
            precision +
            `
            uniform float uOpacity;
            varying vec4 vColor;
            void main() {
                if (vColor.a == 0.0) {
                    discard;
                }
                gl_FragColor = vec4(vColor.rgb, vColor.a * uOpacity);
            }
            `
    };

    const ring = {
        vert:
            precision +
            `
            attribute vec3 aPosition;
            uniform ivec2 uOffset;
            uniform float uRadius;
            uniform float uDegrees;
            uniform float uRadiusOffset;
            uniform ivec2 uTileOffset;
            uniform mat4 uProjectionMatrix;
            uniform vec4 uColor;
            varying vec4 vColor;
            void main() {
                vec2 mPosition = (aPosition.xy + (normalize(aPosition.xy) * (uRadius - uRadiusOffset))) + vec2(uOffset + uTileOffset);
                if (aPosition.z > uDegrees) {
                    vColor = vec4(0.0, 0.0, 0.0, 0.0);
                } else {
                    vColor = uColor;
                }
                gl_Position = uProjectionMatrix * vec4(mPosition, 0.0, 1.0);
            }
            `,
        frag:
            precision +
            `
            uniform float uOpacity;
            varying vec4 vColor;
            void main() {
                if (vColor.a == 0.0) {
                    discard;
                }
                gl_FragColor = vec4(vColor.rgb, vColor.a * uOpacity);
            }
            `
    };

    /**
     * instanced ring shader
     */
    const instancedTick = {
        vert:
            precision +
            `
            attribute vec2 aPosition;
            attribute vec2 aOffset;
            attribute float aRadius;
            uniform ivec2 uTileOffset;
            uniform float uRadiusOffset;
            uniform mat4 uProjectionMatrix;
            void main() {
                ivec2 iOffset = ivec2(aOffset);
                vec2 mPosition = (aPosition + (vec2(0, 1) * aRadius)) + vec2(iOffset + uTileOffset);
                gl_Position = uProjectionMatrix * vec4(mPosition, 0.0, 1.0);
            }
            `,
        frag:
            precision +
            `
            uniform float uOpacity;
            uniform vec4 uColor;
            void main() {
                gl_FragColor = vec4(uColor.rgb, uColor.a * uOpacity);
            }
            `
    };

    module.exports = {

        /**
         * heatmap shader
         */
        heatmap: heatmap,

        /**
         * instanced point shader
         */
        instancedPoint: instancedPoint,

        /**
         * point shader
         */
        point: point,

        /**
         * instanced ring shader
         */
        instancedRing: instancedRing,

        /**
         * ring shader
         */
        ring: ring,

        /**
         * instanced tick shader
         */
        instancedTick: instancedTick

    };

}());
