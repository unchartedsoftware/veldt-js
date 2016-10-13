(function() {

    'use strict';

    const esper = require('esper');
    const rbush = require('rbush');
    const WebGL = require('../../core/WebGL');
    const VertexAtlas = require('./VertexAtlas');
    const Shaders = require('./Shaders');
    const Shapes = require('./Shapes');

    const TILE_SIZE = 256;
    const MAX_POINTS_PER_TILE = TILE_SIZE * TILE_SIZE;

    const NUM_SLICES = 64;
    const POINT_RADIUS = 8;
    const POINT_RADIUS_INC = 2;

    function applyJitter(point, maxDist) {
        const angle = Math.random() * (Math.PI * 2);
        const dist = Math.random() * maxDist;
        point.x += Math.floor(Math.cos(angle) * dist);
        point.y += Math.floor(Math.sin(angle) * dist);
    }

    const Point = WebGL.extend({

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

        highlighted: null,
        selected: null,

        onWebGLInit: function(done) {
            // ensure we use the correct context
            esper.WebGLContext.bind(this._container);
            // create the circle vertexbuffer
            this._circleFillBuffer = Shapes.circle.fill(NUM_SLICES);
            this._circleOutlineBuffer = Shapes.circle.outline(NUM_SLICES);
            // vertex atlas for all tiles
            this._atlas = new VertexAtlas({
                1: {
                    type: 'FLOAT',
                    size: 2
                }
            });
            // create spatial index
            this._rtree = new rbush();
            // load shaders
            this._instancedShader = new esper.Shader({
                vert: Shaders.instancedPoint.vert,
                frag: Shaders.instancedPoint.frag
            });
            this._individualShader = new esper.Shader({
                vert: Shaders.point.vert,
                frag: Shaders.point.frag
            });
            done();
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

        onCacheLoad: function(event) {
            const cached = event.entry;
            const coords = event.coords;
            if (cached.data && cached.data.length > 0) {
                // convert x / y to tile pixels
                const data = cached.data;
                const xField = this.getXField();
                const yField = this.getYField();
                const zoom = coords.z;
                const radius = this.getCollisionRadius();
                const numPoints = Math.min(data.length, MAX_POINTS_PER_TILE);
                const positions = new Float32Array(numPoints*2);
                const points = [];
                const collisions = {};

                const xOffset = coords.x * TILE_SIZE;
                const yOffset = coords.y * TILE_SIZE;

                const tilePoint = { x: 0, y: 0 };
                // calc pixel locations
                for (let i=0; i<numPoints; i++) {
                    const hit = data[i];
                    const x = _.get(hit, xField);
                    const y = _.get(hit, yField);
                    // get position in layer
                    const layerPoint = this.getLayerPointFromDataPoint(x, y, zoom);
                    // add jitter if specified
                    if (this.options.jitter) {
                        const hash = layerPoint.x + ':' + layerPoint.y;
                        if (collisions[hash]) {
                            applyJitter(layerPoint, this.options.jitterDistance);
                        }
                        collisions[hash] = true;
                    }
                    // get position in tile
                    tilePoint.x = layerPoint.x - xOffset;
                    tilePoint.y = TILE_SIZE - (layerPoint.y - yOffset);
                    // store point
                    points.push({
                        x: tilePoint.x,
                        y: tilePoint.y,
                        minX: layerPoint.x - radius,
                        maxX: layerPoint.x + radius,
                        minY: layerPoint.y - radius,
                        maxY: layerPoint.y + radius,
                        data: hit,
                        coords: coords
                    });
                    // add point to buffer
                    positions[i * 2] = tilePoint.x;
                    positions[i * 2 + 1] = tilePoint.y;
                }
                if (points.length > 0) {
                    // bulk insert points to the rtree
                    this._rtree.load(points);
                    // store points in the cache
                    cached.points = points;
                    // add to atlas
                    const ncoords = this.getNormalizedCoords(coords);
                    const hash = this.cacheKeyFromCoord(ncoords);
                    this._atlas.addTile(hash, positions, points.length);
                }
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
                cached.points.forEach(point => {
                    this._rtree.remove(point);
                });
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

        drawInstanced: function(circle, color, radius) {
            const gl = this._gl;
            const shader = this._instancedShader;
            const cache = this._cache;
            const zoom = this._map.getZoom();
            const atlas = this._atlas;
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
            shader.setUniform('uRadius', radius);
            // calc view offset
            const viewOffset = this.getViewOffset();
            // binds the circle to instance
            circle.bind();
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
                        atlas.draw(hash, circle.mode, circle.count);
                    });
                }
            });
            // disable instancing
            atlas.unbind();
            // unbind buffer
            circle.unbind();
        },

        drawIndividual: function(circle, color, radius, tiles, point) {
            // draw selected points
            const gl = this._gl;
            const shader = this._individualShader;
            const zoom = this._map.getZoom();
            // bind the buffer
            circle.bind();
            // disable blending
            gl.disable(gl.BLEND);
            // use shader
            shader.use();
            // use uniform for offset
            shader.setUniform('uProjectionMatrix', this.getProjectionMatrix());
            shader.setUniform('uOpacity', this.getOpacity());
            shader.setUniform('uRadius', radius);
            // view offset
            const viewOffset = this.getViewOffset();
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
                shader.setUniform('uColor', color);
                circle.draw();
            });
            // unbind the buffer
            circle.unbind();
        },

        renderFrame: function() {
            // setup
            const gl = this._gl;
            const viewport = this._viewport;
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
