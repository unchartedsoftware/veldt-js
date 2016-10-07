(function() {

    'use strict';

    let esper = require('esper');

    let TILE_SIZE = 256;
    let COMPONENT_BYTE_SIZE = 4;
    let COMPONENTS_PER_POINT = 2;
    let MAX_TILES = 128;
    let MAX_POINTS_PER_TILE = TILE_SIZE * TILE_SIZE;
    let MAX_TILE_BYTE_SIZE = MAX_POINTS_PER_TILE * COMPONENTS_PER_POINT * COMPONENT_BYTE_SIZE;
    let MAX_BUFFER_BYTE_SIZE = MAX_TILES * MAX_TILE_BYTE_SIZE;
    let OPTIONS = {
        mode: 'POINTS',
        byteLength: MAX_BUFFER_BYTE_SIZE
    };
    let OFFSETS_INDEX = 1;

    class VertexAtlas {

        constructor() {
            // create the root offset buffer
            this.buffer = new esper.VertexBuffer(MAX_BUFFER_BYTE_SIZE);
            // init the chunks
            this.available = new Array(MAX_TILES);
            for (let i=0; i<MAX_TILES; i++) {
                const byteOffset = i * MAX_TILE_BYTE_SIZE;
                const pointer = {};
                pointer[OFFSETS_INDEX] = {
                    size: 2,
                    type: 'FLOAT',
                    byteOffset: byteOffset
                };
                this.available[i] = {
                    byteOffset: byteOffset,
                    count: 0,
                    vertexBuffer: new esper.VertexBuffer(
                        this.buffer.buffer,
                        pointer,
                        OPTIONS)
                };
            }
            this.used = {};
        }

        addTile(hash, data, count) {
            if (this.available.length === 0) {
                console.warn('No available chunks remaining to buffer data');
                return;
            }
            // get an available chunk
            let chunk = this.available.pop();
            // set count
            chunk.count = count;
            // buffer the data into the physical chunk
            this.buffer.bufferSubData(data, chunk.byteOffset);
            // flag as used
            this.used[hash] = chunk;
        }

        removeTile(hash) {
            let chunk = this.used[hash];
            // clear the count
            chunk.count = 0;
            delete this.used[hash];
            // add as a new available chunk
            this.available.push(chunk);
        }

        forEach(fn) {
            _.forIn(this.used, fn);
        }
    }

    module.exports = VertexAtlas;

}());
