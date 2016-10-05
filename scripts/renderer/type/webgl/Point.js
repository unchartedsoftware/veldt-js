(function() {

    'use strict';

    let esper = require('esper');
    let rbush = require('rbush');
    let parallel = require('async/parallel');
    let WebGL = require('../../core/WebGL');
    let VertexAtlas = require('./VertexAtlas');
    let Shaders = require('./Shaders');
    let Shapes = require('./Shapes');

    let TILE_SIZE = 256;
    let COMPONENT_BYTE_SIZE = 2;
    let COMPONENTS_PER_POINT = 4; // encoding two uint32's across xy/zw
    let MAX_POINTS_PER_TILE = TILE_SIZE * TILE_SIZE;
    let MAX_TILE_BYTE_SIZE = MAX_POINTS_PER_TILE * COMPONENTS_PER_POINT * COMPONENT_BYTE_SIZE;

    let NUM_SLICES = 64;
    let POINT_RADIUS = 8;
    let POINT_RADIUS_INC = 2;

    let OFFSETS_INDEX = 1;

    function encodePoint(arraybuffer, index, x, y) {
        arraybuffer[index] = x >> 16;
        arraybuffer[index+1] = x & 0x0000FFFF;
        arraybuffer[index+2] = y >> 16;
        arraybuffer[index+3] = y & 0x0000FFFF;
    }

    function applyJitter(point, maxDist) {
        let angle = Math.random() * (Math.PI * 2);
        let dist = Math.random() * maxDist;
        point.x += Math.floor(Math.cos(angle) * dist);
        point.y += Math.floor(Math.sin(angle) * dist);
    }

    let Point = WebGL.extend({

        options: {
            outlineWidth: 1,
            outlineColor: [0.0, 0.0, 0.0, 1.0],
            fillColor: [0.2, 0.15, 0.4, 0.5],
            radius: POINT_RADIUS,
            selectedOutlineColor: [0.0, 0.0, 0.0, 1.0],
            selectedFillColor: [0.8, 0.4, 0.2, 0.5],
            selectedRadius: POINT_RADIUS + POINT_RADIUS_INC,
            highlightedOutlineColor: [0.0, 0.0, 0.0, 1.0],
            highlightedFillColor: [0.3, 0.25, 0.5, 0.5],
            highlightedRadius: POINT_RADIUS + POINT_RADIUS_INC,
            blending: true,
            jitter: true,
            jitterDistance: 10
        },

        onWebGLInit: function(done) {
            // ensure we use the correct context
            esper.WebGLContext.bind(this._container);
            // get the extension for hardware instancing
            this._ext = esper.WebGLContext.getExtension('ANGLE_instanced_arrays');
            if (!this._ext) {
                throw 'ANGLE_instanced_arrays WebGL extension is not supported';
            }
            // create the circle vertexbuffer
            this._circleFillBuffer = Shapes.circle.fill(NUM_SLICES);
            this._circleOutlineBuffer = Shapes.circle.outline(NUM_SLICES);
            // vertex atlas for all tiles
            this._atlas = new VertexAtlas();
            // create spatial index
            this._rtree = new rbush();
            // load shaders
            parallel({
                instanced: (done) => {
                    let shader = new esper.Shader({
                        vert: Shaders.instancedPoint.vert,
                        frag: Shaders.instancedPoint.frag
                    }, err => {
                        if (err) {
                            done(err, null);
                        }
                        done(null, shader);
                    });
                },
                individual: (done) => {
                    let shader = new esper.Shader({
                        vert: Shaders.point.vert,
                        frag: Shaders.point.frag
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

        getCollisionRadius: function() {
            return this.options.radius + this.options.outlineWidth;
        },

        onAdd: function(map) {
            WebGL.prototype.onAdd.call(this, map);
            map.on('zoomend', this.onZoomEnd, this);
        },

        onRemove: function(map) {
            WebGL.prototype.onRemove.call(this, map);
            map.off('zoomend', this.onZoomEnd, this);
        },

        onZoomStart: function() {
            this._rtree.clear();
            WebGL.prototype.onZoomStart.apply(this, arguments);
        },

        onMouseMove: function(e) {
            let target = e.originalEvent.target;
            let layerPixel = this.getLayerPointFromEvent(e.originalEvent);
            let zoom = this._map.getZoom();
            let size = Math.pow(2, zoom);
            let collisions = this._rtree.search({
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
                let coord = this.getTileCoordFromLayerPoint(collision);
                let hash = this.cacheKeyFromCoord(coord);
                // flag as highlighted
                this.highlighted = {
                    tiles: this._cache[hash].tiles,
                    value: collision,
                    point: [
                        collision.x,
                        (size * TILE_SIZE) - collision.y
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
            let target = e.originalEvent.target;
            let layerPixel = this.getLayerPointFromEvent(e.originalEvent);
            let zoom = this._map.getZoom();
            let size = Math.pow(2, zoom);
            let collisions = this._rtree.search({
                minX: layerPixel.x,
                maxX: layerPixel.x,
                minY: layerPixel.y,
                maxY: layerPixel.y
            });
            if (collisions.length > 0) {
                const collision = collisions[0];
                // use collision point to find tile
                let coord = this.getTileCoordFromLayerPoint(collision);
                let hash = this.cacheKeyFromCoord(coord);
                // flag as selected
                this.selected = {
                    tiles: this._cache[hash].tiles,
                    value: collision,
                    point: [
                        collision.x,
                        (size * TILE_SIZE) - collision.y
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

        onCacheLoad: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            if (cached.data && cached.data.length > 0) {
                // convert x / y to tile pixels
                let data = cached.data;
                let xField = this.getXField();
                let yField = this.getYField();
                let zoom = coords.z;
                let size = Math.pow(2, zoom);
                let radius = this.getCollisionRadius();
                let numBytes = data.length * COMPONENT_BYTE_SIZE * COMPONENTS_PER_POINT;
                let positions = new Uint16Array(Math.min(numBytes, MAX_TILE_BYTE_SIZE));
                let numPoints = Math.min(data.length, MAX_POINTS_PER_TILE);
                let points = [];
                let collisions = {};
                // calc pixel locations
                for (let i=0; i<numPoints; i++) {
                    let hit = data[i];
                    let x = _.get(hit, xField);
                    let y = _.get(hit, yField);
                    if (x !== undefined && y !== undefined) {
                        // get position in layer
                        let layerPoint = this.getLayerPointFromDataPoint(x, y, zoom);
                        // add jitter if specified
                        if (this.options.jitter) {
                            let hash = layerPoint.x + ':' + layerPoint.y;
                            if (collisions[hash]) {
                                applyJitter(layerPoint, this.options.jitterDistance);
                            }
                            collisions[hash] = true;
                        }
                        // store point
                        points.push({
                            x: layerPoint.x,
                            y: layerPoint.y,
                            minX: layerPoint.x - radius,
                            maxX: layerPoint.x + radius,
                            minY: layerPoint.y - radius,
                            maxY: layerPoint.y + radius,
                            data: hit
                        });
                        // encode the point into the buffer
                        encodePoint(
                            positions,
                            i*COMPONENTS_PER_POINT,
                            layerPoint.x,
                            (size * TILE_SIZE) - layerPoint.y);
                    }
                }
                if (points.length > 0) {
                    // bulk insert points to the rtree
                    this._rtree.load(points);
                    // store points in the cache
                    cached.points = points;
                    // add to atlas
                    let ncoords = this.getNormalizedCoords(coords);
                    let hash = this.cacheKeyFromCoord(ncoords);
                    this._atlas.addTile(hash, positions, points.length);
                }
            }
        },

        onCacheUnload: function(event) {
            let cached = event.entry;
            let coords = event.coords;
            if (cached.points) { //cached.data && cached.data.length > 0) {
                // remove from atlas
                let ncoords = this.getNormalizedCoords(coords);
                let hash = this.cacheKeyFromCoord(ncoords);
                this._atlas.removeTile(hash);
                // remove from rtree
                cached.points.forEach(point => {
                    this._rtree.remove(point);
                });
                cached.points = null;
            }
        },

        drawInstanced: function(buffer, color, radius) {
            let gl = this._gl;
            let ext = this._ext;
            let shader = this._instancedShader;
            let cache = this._cache;
            let zoom = this._map.getZoom();
            if (this.options.blending) {
                // enable blending
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            }
            // use shader
            shader.use();
            // set uniforms
            shader.setUniform('uColor', color);
            shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            shader.setUniform('uOpacity', this.getOpacity());
            shader.setUniform('uScale', radius);
            // calc view offset
            let viewOffset = this.getViewOffset();
            // binds the buffer to instance
            buffer.bind();
            // enable instancing
            ext.vertexAttribDivisorANGLE(OFFSETS_INDEX, 1);
            // for each allocated chunk
            this._atlas.forEach((chunk, hash) => {
                // for each tile referring to the data
                let cached = cache[hash];
                if (cached) {
                    // bind the chunk's buffer
                    chunk.vertexBuffer.bind();
                    // render for each tile
                    _.keys(cached.tiles).forEach(hash => {
                        let coords = this.coordFromCacheKey(hash);
                        if (coords.z !== zoom) {
                            // NOTE: we have to check here if the tiles are stale or not
                            return;
                        }
                        // upload view offset
                        let offset = this.getWrapAroundOffset(coords);
                        let totalOffset = [
                            viewOffset[0] - offset[0],
                            viewOffset[1] - offset[1],
                        ];
                        shader.setUniform('uViewOffset', totalOffset);
                        // draw the istances
                        ext.drawArraysInstancedANGLE(
                            gl[buffer.mode],
                            0,
                            buffer.count,
                            chunk.count);
                    });
                    // unbind
                    chunk.vertexBuffer.unbind();
                }
            });
            // disable instancing
            ext.vertexAttribDivisorANGLE(OFFSETS_INDEX, 0);
            // unbind buffer
            buffer.unbind();
        },

        drawIndividual: function(buffer, color, radius, tiles, point) {
            // draw selected points
            let gl = this._gl;
            let shader = this._individualShader;
            let zoom = this._map.getZoom();
            // bind the buffer
            buffer.bind();
            // disable blending
            gl.disable(gl.BLEND);
            // use shader
            shader.use();
            // use uniform for offset
            shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            shader.setUniform('uOpacity', this.getOpacity());
            shader.setUniform('uScale', radius);
            // view offset
            let viewOffset = this.getViewOffset();
            _.forIn(tiles, tile => {
                if (tile.coords.z !== zoom) {
                    // NOTE: we have to check here if the tiles are stale or not
                    return;
                }
                // upload view offset
                let offset = this.getWrapAroundOffset(tile.coords);
                let totalOffset = [
                    viewOffset[0] - offset[0],
                    viewOffset[1] - offset[1],
                ];
                shader.setUniform('uViewOffset', totalOffset);
                shader.setUniform('uOffset', point);
                shader.setUniform('uColor', color);
                buffer.draw();
            });
            // unbind the buffer
            buffer.unbind();
        },

        renderFrame: function() {
            // setup
            let gl = this._gl;
            let viewport = this._viewport;
            viewport.push();

            // draw instanced points

            // draw instanced fill
            this.drawInstanced(
                this._circleFillBuffer,
                this.options.fillColor,
                this.options.radius);
            // draw instanced outlines
            gl.lineWidth(this.options.outlineWidth);
            this.drawInstanced(
                this._circleOutlineBuffer,
                this.options.outlineColor,
                this.options.radius);

            // draw individual points

            if (this.highlighted) {
                // draw individual fill
                this.drawIndividual(
                    this._circleFillBuffer,
                    this.options.highlightedFillColor,
                    this.options.highlightedRadius,
                    this.highlighted.tiles,
                    this.highlighted.point);
                // draw individual outline
                gl.lineWidth(this.options.outlineWidth);
                this.drawIndividual(
                    this._circleOutlineBuffer,
                    this.options.highlightedOutlineColor,
                    this.options.highlightedRadius,
                    this.highlighted.tiles,
                    this.highlighted.point);
            }

            if (this.selected) {
                // draw individual fill
                this.drawIndividual(
                    this._circleFillBuffer,
                    this.options.selectedFillColor,
                    this.options.selectedRadius,
                    this.selected.tiles,
                    this.selected.point);
                // draw individual outline
                gl.lineWidth(this.options.outlineWidth);
                this.drawIndividual(
                    this._circleOutlineBuffer,
                    this.options.selectedOutlineColor,
                    this.options.selectedRadius,
                    this.selected.tiles,
                    this.selected.point);
            }

            // teardown
            viewport.pop();
        }

    });

    module.exports = Point;

}());
