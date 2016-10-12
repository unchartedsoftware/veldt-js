(function() {

    'use strict';

    let esper = require('esper');
    let ValueTransform = require('../../mixin/ValueTransform');
    let WebGL = require('../../core/WebGL');
    let VertexAtlas = require('./VertexAtlas');
    let Shaders = require('./Shaders');
    let Shapes = require('./Shapes');

    let TILE_SIZE = 256;
    let NUM_SLICES = 360;
    let RADIUS = 10;

    let Cluster = WebGL.extend({

        includes: [
            // mixins
            ValueTransform
        ],

        options: {
            outlineWidth: 2,
            outlineColor: [0.0, 0.0, 0.0, 1.0],
            ringWidth: 4,
            blending: true,
            radiusField: 'node.radius'
        },

        onWebGLInit: function(done) {
            // ensure we use the correct context
            esper.WebGLContext.bind(this._container);
            // create the ring vertexbuffer
            this._ringFillBuffer = Shapes.ring.fill(NUM_SLICES, RADIUS, this.options.ringWidth);
            this._ringOutlineBuffer = Shapes.ring.fill(NUM_SLICES, RADIUS, this.options.ringWidth + this.options.outlineWidth);
            // vertex atlas for all tiles
            this._atlas = new VertexAtlas({
                1: {
                    type: 'FLOAT',
                    size: 2
                },
                2: {
                    type: 'FLOAT',
                    size: 1
                }
            });
            // load shader
            this._shader = new esper.Shader({
                vert: Shaders.instancedRing.vert,
                frag: Shaders.instancedRing.frag
            }, err => {
                if (err) {
                    done(err);
                }
                done(null);
            });
        },

        onCacheLoad: function(event) {
            const cached = event.entry;
            const coords = event.coords;
            const data = cached.data;
            if (!data) {
                return;
            }
            const vertices = new Float32Array(data.length * 3);
            let numPoints = 0;
            data.forEach(community => {
                const nval = this.transformValue(_.get(community, this.options.degreeField));
                if (nval < this.options.communityThreshold) {
                    return;
                }
                const scale = Math.pow(2, coords.z);
                const radius = Math.max(4, _.get(community, this.options.radiusField) * scale);
                const tileSpan = Math.pow(2, 32) / scale;
                const xVal = _.get(community, this.getXField());
                const yVal = _.get(community, this.getYField());
                const x = ((xVal % tileSpan) / tileSpan) * TILE_SIZE;
                const y = ((yVal % tileSpan) / tileSpan) * TILE_SIZE;
                // add point to buffer
                vertices[numPoints * 3] = x;
                vertices[numPoints * 3 + 1] = (TILE_SIZE - y);
                vertices[numPoints * 3 + 2] = radius;
                // increment point count
                numPoints++;
            });
            cached.numPoints = numPoints;
            if (numPoints > 0) {
                let ncoords = this.getNormalizedCoords(coords);
                let hash = this.cacheKeyFromCoord(ncoords);
                this._atlas.addTile(hash, vertices, numPoints);
            }
        },

        onCacheUnload: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            if (cached.numPoints > 0) {
                cached.numPoints = 0;
                let ncoords = this.getNormalizedCoords(coords);
                let hash = this.cacheKeyFromCoord(ncoords);
                this._atlas.removeTile(hash);
            }
        },

        drawInstanced: function(ring, color) {
            let gl = this._gl;
            let shader = this._shader;
            let cache = this._cache;
            let zoom = this._map.getZoom();
            let atlas = this._atlas;
            if (this.options.blending) {
                // enable blending
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            }
            // use shader
            shader.use();
            // set uniforms
            shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            shader.setUniform('uColor', color);
            //shader.setUniform('uDegrees', 180);
            shader.setUniform('uRadiusOffset', RADIUS);
            shader.setUniform('uOpacity', this.getOpacity());
            // calc view offset
            let viewOffset = this.getViewOffset();
            // bind the circle to instance
            ring.bind();
            // bind offsets and enable instancing
            atlas.bind();
            // for each allocated chunk
            atlas.forEach((chunk, hash) => {
                // for each tile referring to the data
                let cached = cache[hash];
                if (cached) {
                    // render for each tile
                    _.keys(cached.tiles).forEach(hash => {
                        let coords = this.coordFromCacheKey(hash);
                        if (coords.z !== zoom) {
                            // NOTE: we have to check here if the tiles are stale or not
                            return;
                        }
                        // get wrap offset
                        let wrapOffset = this.getWrapAroundOffset(coords);
                        // get tile offset
                        let tileOffset = this.getTileOffset(coords);
                        // calculate the total tile offset
                        let totalOffset = [
                            tileOffset[0] + wrapOffset[0] - viewOffset[0],
                            tileOffset[1] + wrapOffset[1] - viewOffset[1]
                        ];
                        shader.setUniform('uTileOffset', totalOffset);
                        // draw the instances
                        atlas.draw(hash, ring.mode, ring.count);
                    });
                }
            });
            // disable instancing
            atlas.unbind();
            // unbind buffer
            ring.unbind();
        },

        renderFrame: function() {
            // setup
            let viewport = this._viewport;
            viewport.push();
            // draw instanced outlines
            this.drawInstanced(
                this._ringOutlineBuffer,
                this.options.outlineColor);
            // draw instanced fill
            this.drawInstanced(
                this._ringFillBuffer,
                [0.2, 0.9, 0.4, 1.0]);
            // teardown
            viewport.pop();
        }

    });

    module.exports = Cluster;

}());
