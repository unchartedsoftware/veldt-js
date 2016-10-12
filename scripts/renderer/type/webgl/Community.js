(function() {

    'use strict';

    const esper = require('esper');
    const rbush = require('rbush');
    const parallel = require('async/parallel');
    const ValueTransform = require('../../mixin/ValueTransform');
    const WebGL = require('../../core/WebGL');
    const VertexAtlas = require('./VertexAtlas');
    const Shaders = require('./Shaders');
    const Shapes = require('./Shapes');

    const TILE_SIZE = 256;
    const NUM_SLICES = 360;
    const RADIUS = 10;

    const Cluster = WebGL.extend({

        includes: [
            // mixins
            ValueTransform
        ],

        options: {
            outlineWidth: 2,
            outlineColor: [0.0, 0.0, 0.0, 1.0],
            ringWidth: 3,
            ringOffset: 0,
            radiusField: 'node.radius'
        },

        highlighted: null,
        selected: null,

        onWebGLInit: function(done) {
            // ensure we use the correct context
            esper.WebGLContext.bind(this._container);
            // create the ring vertexbuffer
            this._ringFillBuffer = Shapes.ring.fill(
                NUM_SLICES, RADIUS,
                this.options.ringWidth);
            this._ringOutlineBuffer = Shapes.ring.fill(
                NUM_SLICES, RADIUS,
                this.options.ringWidth + this.options.outlineWidth);
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
            // create spatial index
            this._rtree = new rbush();
            // load shader
            // load shaders
            parallel({
                instanced: (done) => {
                    const shader = new esper.Shader({
                        vert: Shaders.instancedRing.vert,
                        frag: Shaders.instancedRing.frag
                    }, err => {
                        if (err) {
                            done(err, null);
                        }
                        done(null, shader);
                    });
                },
                individual: (done) => {
                    const shader = new esper.Shader({
                        vert: Shaders.ring.vert,
                        frag: Shaders.ring.frag
                    }, err => {
                        if (err) {
                            done(err, null);
                        }
                        done(null, shader);
                    });
                }
            }, (err, shaders) => {
                if (err) {
                    done(err);
                }
                this._instancedShader = shaders.instanced;
                this._individualShader = shaders.individual;
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
            const radiusOffset =
                this.options.ringOffset +
                this.options.ringWidth +
                this.options.outlineWidth;
            const vertices = new Float32Array(data.length * 3);
            const tileOffset = {
                x: coords.x * TILE_SIZE,
                y: coords.y * TILE_SIZE,
            };
            const tilePoint = { x: 0, y: 0 };
            const layerPoint = { x: 0, y: 0 };
            const points = [];
            for (let i = 0; i<data.length; i++) {
                const community = data[i];
                const nval = this.transformValue(_.get(community, this.options.degreeField));
                if (nval < this.options.communityThreshold) {
                    return;
                }
                const scale = Math.pow(2, coords.z);
                const radius = Math.max(4, _.get(community, this.options.radiusField) * scale) + radiusOffset;
                const tileSpan = Math.pow(2, 32) / scale;
                const xVal = _.get(community, this.getXField());
                const yVal = _.get(community, this.getYField());
                const x = ((xVal % tileSpan) / tileSpan) * TILE_SIZE;
                const y = ((yVal % tileSpan) / tileSpan) * TILE_SIZE;
                // get position in tile
                tilePoint.x = x;
                tilePoint.y = TILE_SIZE - y;
                // get position in layer
                layerPoint.x = x + tileOffset.x;
                layerPoint.y = y + tileOffset.y;
                // store point
                points.push({
                    x: tilePoint.x,
                    y: tilePoint.y,
                    radius: radius,
                    minX: layerPoint.x - radius,
                    maxX: layerPoint.x + radius,
                    minY: layerPoint.y - radius,
                    maxY: layerPoint.y + radius,
                    data: community,
                    coords: coords
                });
                // add point to buffer
                vertices[i * 3] = tilePoint.x;
                vertices[i * 3 + 1] = tilePoint.y;
                vertices[i * 3 + 2] = radius;
            }
            if (points.length > 0) {
                // bulk insert points to the rtree
                this._rtree.load(points);
                // store points in the cache
                cached.points = points;
                const ncoords = this.getNormalizedCoords(coords);
                const hash = this.cacheKeyFromCoord(ncoords);
                this._atlas.addTile(hash, vertices, points.length);
            }
        },

        onCacheUnload: function(event) {
            const cached = event.entry;
            if (cached.points) {
                const coords = event.coords;
                // remove from atlas
                const ncoords = this.getNormalizedCoords(coords);
                const hash = this.cacheKeyFromCoord(ncoords);
                this._atlas.removeTile(hash);
                // remove from rtree
                const points = cached.points;
                for (let i=0; i<points.length; i++) {
                    this._rtree.remove(points[i]);
                }
                cached.points = null;
            }
        },

        onMouseMove: function(e) {
            const target = e.originalEvent.target;
            const layerPixel = this.getLayerPointFromEvent(e.originalEvent);
            const collisions = this._rtree.search({
                minX: layerPixel.x,
                maxX: layerPixel.x,
                minY: layerPixel.y,
                maxY: layerPixel.y
            });
            if (collisions.length > 0) {
                const collision = collisions[0];
                // mimic mouseover / mouseout events
                if (this.highlighted) {
                    if (this.highlighted.value !== collision) {
                        // new collision
                        // execute mouseout for old
                        this.fire('mouseout', {
                            elem: target,
                            value: this.highlighted.value
                        });
                        // execute mouseover for new
                        this.fire('mouseover', {
                            elem: target,
                            value: collision
                        });
                    }
                } else {
                    // no previous collision, execute mouseover
                    this.fire('mouseover', {
                        elem: target,
                        value: collision
                    });
                }
                // use collision point to find tile
                const hash = this.cacheKeyFromCoord(collision.coords);
                // flag as highlighted
                this.highlighted = {
                    tiles: this._cache[hash].tiles,
                    value: collision,
                    radius: collision.radius,
                    point: [
                        collision.x,
                        collision.y
                    ]
                };
                // set cursor
                $(this._map._container).css('cursor', 'pointer');
                return;
            }
            // mouse out
            if (this.highlighted) {
                this.fire('mouseout', {
                    elem: target,
                    value: this.highlighted.value
                });
            }
            // clear highlighted flag
            this.highlighted = null;
        },

        onClick: function(e) {
            const target = e.originalEvent.target;
            const layerPixel = this.getLayerPointFromEvent(e.originalEvent);
            const collisions = this._rtree.search({
                minX: layerPixel.x,
                maxX: layerPixel.x,
                minY: layerPixel.y,
                maxY: layerPixel.y
            });
            if (collisions.length > 0) {
                const collision = collisions[0];
                // use collision point to find tile
                const hash = this.cacheKeyFromCoord(collision.coords);
                // flag as selected
                this.selected = {
                    tiles: this._cache[hash].tiles,
                    value: collision,
                    radius: collision.radius,
                    point: [
                        collision.x,
                        collision.y
                    ]
                };
                this.fire('click', {
                    elem: target,
                    value: collision
                });
            } else {
                this.selected = null;
            }
        },

        drawInstancedOutline: function(ring, color) {
            const shader = this._instancedShader;
            const cache = this._cache;
            const zoom = this._map.getZoom();
            const atlas = this._atlas;
            // use shader
            shader.use();
            // set uniforms
            shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            shader.setUniform('uColor', color);
            shader.setUniform('uDegrees', 360);
            shader.setUniform('uRadiusOffset', RADIUS);
            shader.setUniform('uOpacity', this.getOpacity());
            // calc view offset
            const viewOffset = this.getViewOffset();
            // bind the circle to instance
            ring.bind();
            // bind offsets and enable instancing
            atlas.bind();
            // for each allocated chunk
            atlas.forEach((chunk, hash) => {
                // for each tile referring to the data
                const cached = cache[hash];
                if (cached) {
                    // render for each tile
                    _.keys(cached.tiles).forEach(hash => {
                        const coords = this.coordFromCacheKey(hash);
                        if (coords.z !== zoom) {
                            // NOTE: we have to check here if the tiles are stale or not
                            return;
                        }
                        // get wrap offset
                        const wrapOffset = this.getWrapAroundOffset(coords);
                        // get tile offset
                        const tileOffset = this.getTileOffset(coords);
                        // calculate the total tile offset
                        const totalOffset = [
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

        drawInstancedFill: function(ring, segments) {
            const shader = this._instancedShader;
            const cache = this._cache;
            const zoom = this._map.getZoom();
            const atlas = this._atlas;
            // use shader
            shader.use();
            // set uniforms
            shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            shader.setUniform('uRadiusOffset', RADIUS);
            shader.setUniform('uOpacity', this.getOpacity());
            // calc view offset
            const viewOffset = this.getViewOffset();
            // bind the circle to instance
            ring.bind();
            // bind offsets and enable instancing
            atlas.bind();
            // for each allocated chunk
            atlas.forEach((chunk, hash) => {
                // for each tile referring to the data
                const cached = cache[hash];
                if (cached) {
                    segments.forEach((segment) => {
                        shader.setUniform('uColor', segment.color);
                        shader.setUniform('uDegrees', segment.percent * 360);
                        // render for each tile
                        _.keys(cached.tiles).forEach(hash => {
                            const coords = this.coordFromCacheKey(hash);
                            if (coords.z !== zoom) {
                                // NOTE: we have to check here if the tiles are stale or not
                                return;
                            }
                            // get wrap offset
                            const wrapOffset = this.getWrapAroundOffset(coords);
                            // get tile offset
                            const tileOffset = this.getTileOffset(coords);
                            // calculate the total tile offset
                            const totalOffset = [
                                tileOffset[0] + wrapOffset[0] - viewOffset[0],
                                tileOffset[1] + wrapOffset[1] - viewOffset[1]
                            ];
                            shader.setUniform('uTileOffset', totalOffset);
                            // draw the instances
                            atlas.draw(hash, ring.mode, ring.count);
                        });
                    });
                }
            });
            // disable instancing
            atlas.unbind();
            // unbind buffer
            ring.unbind();
        },

        drawIndividualFill: function(ring, segments, tiles, point, radius) {
            // draw selected points
            const shader = this._individualShader;
            const zoom = this._map.getZoom();
            // bind the buffer
            ring.bind();
            // use shader
            shader.use();
            // use uniform for offset
            shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            shader.setUniform('uRadiusOffset', RADIUS);
            shader.setUniform('uRadius', radius);
            shader.setUniform('uOpacity', this.getOpacity());
            // view offset
            const viewOffset = this.getViewOffset();

            segments.forEach((segment) => {
                shader.setUniform('uColor', segment.color);
                shader.setUniform('uDegrees', segment.percent * 360);
                _.forIn(tiles, tile => {
                    if (tile.coords.z !== zoom) {
                        // NOTE: we have to check here if the tiles are stale or not
                        return;
                    }
                    // get wrap offset
                    const wrapOffset = this.getWrapAroundOffset(tile.coords);
                    // get tile offset
                    const tileOffset = this.getTileOffset(tile.coords);
                    // calculate the total tile offset
                    const totalOffset = [
                        tileOffset[0] + wrapOffset[0] - viewOffset[0],
                        tileOffset[1] + wrapOffset[1] - viewOffset[1]
                    ];
                    shader.setUniform('uTileOffset', totalOffset);
                    shader.setUniform('uOffset', point);
                    ring.draw();
                });
            });
            // unbind the buffer
            ring.unbind();
        },

        renderFrame: function() {
            // setup
            const gl = this._gl;
            const viewport = this._viewport;
            viewport.push();

            // TEMP
            const segments = [
                {
                    color: [ 0.2, 0.2, 0.2, 1.0 ],
                    percent: 1
                },
                {
                    color: [ 0.4, 0.4, 0.4, 1.0 ],
                    percent: 0.8
                },
                {
                    color: [ 0.8, 0.8, 0.8, 1.0 ],
                    percent: 0.4
                }
            ];

            const selectedSegments = [
                {
                    color: [ 0.4, 0.4, 0.4, 1.0 ],
                    percent: 1
                },
                {
                    color: [ 0.6, 0.6, 0.6, 1.0 ],
                    percent: 0.8
                },
                {
                    color: [ 1.0, 1.0, 1.0, 1.0 ],
                    percent: 0.4
                }
            ];

            // disable blending
            gl.disable(gl.BLEND);

            // draw instanced outlines
            this.drawInstancedOutline(
                this._ringOutlineBuffer,
                this.options.outlineColor);
            // draw instanced fill
            this.drawInstancedFill(
                this._ringFillBuffer,
                segments);

            if (this.highlighted) {
                // draw individual fill
                this.drawIndividualFill(
                    this._ringFillBuffer,
                    selectedSegments,
                    this.highlighted.tiles,
                    this.highlighted.point,
                    this.highlighted.radius);
            }

            if (this.selected) {
                // draw individual fill
                this.drawIndividualFill(
                    this._ringFillBuffer,
                    selectedSegments,
                    this.selected.tiles,
                    this.selected.point,
                    this.selected.radius);
            }

            // teardown
            viewport.pop();
        }
    });

    module.exports = Cluster;

}());
