(function() {

    'use strict';

    const esper = require('esper');

    const POSITIONS_INDEX = 0;

    function circleOutline(numSegments) {
        let theta = (2 * Math.PI) / numSegments;
        let radius = 1.0;
        // precalculate sine and cosine
        let c = Math.cos(theta);
        let s = Math.sin(theta);
        let t;
        // start at angle = 0
        let x = radius;
        let y = 0;
        let positions = new Float32Array(numSegments * 2);
        for(let i = 0; i < numSegments; i++) {
            positions[i*2] = x;
            positions[i*2+1] = y;
            // apply the rotation
            t = x;
            x = c * x - s * y;
            y = s * t + c * y;
        }
        let pointers = {};
        pointers[POSITIONS_INDEX] = {
            size: 2,
            type: 'FLOAT'
        };
        let options = {
            mode: 'LINE_LOOP',
            count: positions.length / 2
        };
        return new esper.VertexBuffer(positions, pointers, options);
    }

    function circleFill(numSegments) {
        let theta = (2 * Math.PI) / numSegments;
        let radius = 1.0;
        // precalculate sine and cosine
        let c = Math.cos(theta);
        let s = Math.sin(theta);
        let t;
        // start at angle = 0
        let x = radius;
        let y = 0;
        let positions = new Float32Array((numSegments + 2) * 2);
        positions[0] = 0;
        positions[1] = 0;
        positions[positions.length-2] = radius;
        positions[positions.length-1] = 0;
        for(let i = 0; i < numSegments; i++) {
            positions[(i+1)*2] = x;
            positions[(i+1)*2+1] = y;
            // apply the rotation
            t = x;
            x = c * x - s * y;
            y = s * t + c * y;
        }
        let pointers = {};
        pointers[POSITIONS_INDEX] = {
            size: 2,
            type: 'FLOAT'
        };
        let options = {
            mode: 'TRIANGLE_FAN',
            count: positions.length / 2
        };
        return new esper.VertexBuffer(positions, pointers, options);
    }

    function quadFill(size) {
        // quad vertices
        let vertices = new Float32Array([
            // positions
            0, 0,
            size, 0,
            size, size,
            0, 0,
            size, size,
            0, size,
            // uvs
            0, 0,
            1, 0,
            1, 1,
            0, 0,
            1, 1,
            0, 1
        ]);
        // quad buffer
        return new esper.VertexBuffer(
            vertices,
            {
                0: {
                    size: 2,
                    type: 'FLOAT',
                    byteOffset: 0
                },
                1: {
                    size: 2,
                    type: 'FLOAT',
                    byteOffset: 2 * 6 * 4
                }
            },
            {
                count: 6,
            });
    }

    module.exports = {

        circle: {
            fill: circleFill,
            outline: circleOutline
        },

        quad: {
            fill: quadFill
        }

    };

}());
