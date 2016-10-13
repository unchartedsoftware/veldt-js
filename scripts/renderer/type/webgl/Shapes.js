(function() {

    'use strict';

    const esper = require('esper');

    function circleOutline(numSegments) {
        const theta = (2 * Math.PI) / numSegments;
        const radius = 1.0;
        // precalculate sine and cosine
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        // start at angle = 0
        let x = radius;
        let y = 0;
        const positions = new Float32Array(numSegments * 2);
        for (let i = 0; i < numSegments; i++) {
            positions[i*2] = x;
            positions[i*2+1] = y;
            // apply the rotation
            const t = x;
            x = c * x - s * y;
            y = s * t + c * y;
        }
        const pointers = {
            0: {
                size: 2,
                type: 'FLOAT'
            }
        };
        const options = {
            mode: 'LINE_LOOP',
            count: positions.length / 2
        };
        return new esper.VertexBuffer(positions, pointers, options);
    }

    function circleFill(numSegments) {
        const theta = (2 * Math.PI) / numSegments;
        const radius = 1.0;
        // precalculate sine and cosine
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        // start at angle = 0
        let x = radius;
        let y = 0;
        const positions = new Float32Array((numSegments + 2) * 2);
        positions[0] = 0;
        positions[1] = 0;
        positions[positions.length-2] = radius;
        positions[positions.length-1] = 0;
        for (let i = 0; i < numSegments; i++) {
            positions[(i+1)*2] = x;
            positions[(i+1)*2+1] = y;
            // apply the rotation
            const t = x;
            x = c * x - s * y;
            y = s * t + c * y;
        }
        const pointers = {
            0: {
                size: 2,
                type: 'FLOAT'
            }
        };
        const options = {
            mode: 'TRIANGLE_FAN',
            count: positions.length / 2
        };
        return new esper.VertexBuffer(positions, pointers, options);
    }

    function ringFill(numSegments, radius, outline) {
        const theta = (2 * Math.PI) / numSegments;
        // precalculate sine and cosine
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        // start at angle = 0
        let x0 = 0;
        let y0 = radius - (outline / 2);
        let x1 = 0;
        let y1 = radius + (outline / 2);
        const degPerSeg = (360 / (numSegments+1));
        const positions = new Float32Array((numSegments + 1) * (3 + 3));
        for (let i = 0; i <= numSegments; i++) {
            positions[i*6] = x0;
            positions[i*6+1] = y0;
            positions[i*6+2] = i * degPerSeg;
            positions[i*6+3] = x1;
            positions[i*6+4] = y1;
            positions[i*6+5] = i * degPerSeg;
            // apply the rotation
            let t = x0;
            x0 = c * x0 - s * y0;
            y0 = s * t + c * y0;
            t = x1;
            x1 = c * x1 - s * y1;
            y1 = s * t + c * y1;
        }
        const pointers = {
            0: {
                size: 3, // x, y, degree
                type: 'FLOAT'
            }
        };
        const options = {
            mode: 'TRIANGLE_STRIP',
            count: positions.length / 3
        };
        return new esper.VertexBuffer(positions, pointers, options);
    }

    function quadTextured(size) {
        // quad vertices
        const vertices = new Float32Array([
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

    function quadFill(left, right, bottom, top) {
        // quad vertices
        const vertices = new Float32Array([
            // positions
            left, bottom,
            right, bottom,
            right, top,
            left, bottom,
            right, top,
            left, top
        ]);
        // quad buffer
        return new esper.VertexBuffer(
            vertices,
            {
                0: {
                    size: 2,
                    type: 'FLOAT',
                    byteOffset: 0
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
            textured: quadTextured,
            fill: quadFill
        },

        ring: {
            fill: ringFill
        }

    };

}());
