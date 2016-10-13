(function() {

    'use strict';

    const esper = require('esper');

    const TILE_SIZE = 256;
    const HORIZONTAL_TILES = 16;
    const VERTICAL_TILES = 8;

    class TextureAtlas {

        constructor() {
            // mega texture for all tiles
            this.texture = new esper.Texture2D({
                width: TILE_SIZE * HORIZONTAL_TILES,
                height: TILE_SIZE * VERTICAL_TILES,
                src: null,
                mipMap: false,
                format: 'RGBA',
                type: 'UNSIGNED_BYTE',
                wrap: 'CLAMP_TO_EDGE',
                filter: 'NEAREST',
                invertY: true
            });
            // init the chunks// allocate available chunks
            this.available = new Array(HORIZONTAL_TILES*VERTICAL_TILES);
            for (let i=0; i<HORIZONTAL_TILES; i++) {
                for (let j=0; j<VERTICAL_TILES; j++) {
                    this.available[i*VERTICAL_TILES + j] = {
                        xPixelOffset: i * TILE_SIZE,
                        yPixelOffset: j * TILE_SIZE,
                        uvOffset: [
                            i / HORIZONTAL_TILES,
                            j / VERTICAL_TILES
                        ],
                        uvExtent: [
                            0,
                            0
                        ],
                        resolution: 0
                    };
                }
            }
            this.used = new Map();
        }

        addTile(hash, data) {
            if (this.available.length === 0) {
                console.warn('No available chunks remaining to buffer data');
                return;
            }
            // get an available chunk
            const chunk = this.available.pop();
            // set chunk resolution and extents
            chunk.resolution = Math.sqrt(data.length / 4);
            chunk.uvExtent[0] = (chunk.resolution / TILE_SIZE) / HORIZONTAL_TILES;
            chunk.uvExtent[1] = (chunk.resolution / TILE_SIZE) / VERTICAL_TILES;
            // buffer the data into the physical chunk
            this.texture.bufferSubData(
                data,
                chunk.xPixelOffset,
                chunk.yPixelOffset,
                chunk.resolution,
                chunk.resolution);
            // flag as used
            this.used.set(hash, chunk);
        }

        removeTile(hash) {
            const chunk = this.used.get(hash);
            // remove from used
            this.used.delete(hash);
            // add as a new available chunk
            this.available.push(chunk);
        }

        forEach(fn) {
            this.used.forEach(fn);
        }
    }

    module.exports = TextureAtlas;

}());
