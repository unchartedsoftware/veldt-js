(function() {

    'use strict';

    const esper = require('esper');
    const forIn = require('lodash/forIn');

    const TILE_SIZE = 256;
    const MAX_TILES = 128;
    const MAX_POINTS_PER_TILE = TILE_SIZE * TILE_SIZE;

    const BYTES_PER_TYPE = {
        BYTE: 1,
        UNSIGNED_BYTE: 1,
        SHORT: 2,
        UNSIGNED_SHORT: 2,
        FIXED: 4,
        FLOAT: 4
    };

    const calcChunkByteSize = function(pointers, chunkSize) {
        let byteSize = 0;
        pointers.forEach(pointer => {
            byteSize += BYTES_PER_TYPE[pointer.type] * pointer.size * chunkSize;
        });
        return byteSize;
    };

    const calcByteOffsets = function(chunk, pointers, chunkByteOffset) {
        let byteOffset = 0;
        pointers.forEach((pointer, location) => {
            chunk.byteOffsets[location] = chunkByteOffset + byteOffset;
            byteOffset += BYTES_PER_TYPE[pointer.type] * pointer.size;
        });
        chunk.byteStride = byteOffset;
    };

    class VertexAtlas {
        constructor(pointers) {
            // get context
            const gl = this.gl = esper.WebGLContext.get();
            // get the extension for hardware instancing
            this.ext = esper.WebGLContext.getExtension('ANGLE_instanced_arrays');
            if (!this.ext) {
                throw 'ANGLE_instanced_arrays WebGL extension is not supported';
            }
            this.numChunks = MAX_TILES;
            this.chunkSize = MAX_POINTS_PER_TILE;
            // set the pointers of the atlas
            this.pointers = new Map();
            forIn(pointers, (pointer, index) => {
                this.pointers.set(index, pointer);
            });
            // create available chunks
            this.available = new Array(this.numChunks);
            // calc the chunk byte size
            const chunkByteSize = calcChunkByteSize(
                this.pointers,
                this.chunkSize);
            // for each chunk
            for (let i=0; i<this.numChunks; i++) {
                const chunkByteOffset = i * chunkByteSize;
                const available = {
                    count: 0,
                    chunkByteOffset: chunkByteOffset,
                    byteOffsets: {},
                    byteStride: 0
                };
                // calculate interleaved offsets / stride, this only needs
                // to be done once
                calcByteOffsets(
                    available,
                    this.pointers,
                    chunkByteOffset);
                // add chunk
                this.available[i] = available;
            }
            this.used = new Map();
            // create buffer
            this.buffer = gl.createBuffer();
            // calc total size of the buffer
            const byteSize = chunkByteSize * this.numChunks;
            // buffer the data
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, byteSize, gl.DYNAMIC_DRAW);
        }
        addTile(key, data, count) {
            if (this.available.length === 0) {
                console.warn('No available chunks remaining to buffer data');
                return;
            }
            // get an available chunk
            const chunk = this.available.pop();
            // update chunk count
            chunk.count = count;
            // buffer the data
            const gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, chunk.chunkByteOffset, data);
            // add to used
            this.used.set(key, chunk);
        }
        removeTile(key) {
            // get chunk
            const chunk = this.used.get(key);
            // remove from used
            this.used.delete(key);
            // add to available
            this.available.push(chunk);
            return this;
        }
        bind() {
            const gl = this.gl;
            const ext = this.ext;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            // for each attribute pointer
            this.pointers.forEach((pointer, index) => {
                // enable attribute index
                gl.enableVertexAttribArray(index);
                // enable instancing this attribute
                ext.vertexAttribDivisorANGLE(index, 1);
            });
            return this;
        }
        unbind() {
            const gl = this.gl;
            const ext = this.ext;
            // for each attribute pointer
            this.pointers.forEach((pointer, index) => {
                if (index !== 0) {
                    // disable attribute index
                    gl.disableVertexAttribArray(index);
                }
                // disable instancing this attribute
                ext.vertexAttribDivisorANGLE(index, 0);
            });
            return this;
        }
        forEach(fn) {
            this.used.forEach(fn);
        }
        draw(key, mode, count) {
            const gl = this.gl;
            const ext = this.ext;
            const chunk = this.used.get(key);
            // for each attribute pointer
            this.pointers.forEach((pointer, index) => {
                // set attribute pointer
                gl.vertexAttribPointer(
                    index,
                    pointer.size,
                    gl[pointer.type],
                    false,
                    chunk.byteStride,
                    chunk.byteOffsets[index]);
            });
            // draw the bound vertex array
            ext.drawArraysInstancedANGLE(gl[mode], 0, count, chunk.count);
        }
    }

    module.exports = VertexAtlas;

}());
