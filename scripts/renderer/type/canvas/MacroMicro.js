(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');
    var ColorRamp = require('../../mixin/ColorRamp');
    var ValueTransform = require('../../mixin/ValueTransform');

    var TILE_SIZE = 256;

    // TODO: currently the tiles edges are padded by the point radius to prevent
    // cutoff of circles. This means that there is a radius*2 amount of overlap
    // between each tile. Currently this is not taken into account for mouse
    // events, which will give priority to tiles that are 'above' others.

    // TODO: above issue causes selection on highlighting errors when clicking
    // on overlapped tiles.

    function fract(f) {
        return f % 1;
    }

    function getHash(tx, ty, radius) {
        var diameter = radius * 2;
        var xHash = Math.floor(tx / diameter);
        var yHash = Math.floor(ty / diameter);
        return xHash + ':' + yHash;
    }

    function getHashes(tx, ty, radius) {
        var diameter = radius * 2;
        var numCells = (TILE_SIZE + diameter) / diameter;
        var x = tx / diameter;
        var y = ty / diameter;
        var fx = fract(x);
        var fy = fract(y);
        var px = fx > 0.5;
        var nx = fx < 0.5;
        var py = fy > 0.5;
        var ny = fy < 0.5;
        var cx = Math.floor(x);
        var cy = Math.floor(y);
        var cells = [
            [cx, cy]
        ];
        if (px) {
            cells.push([cx+1, cy]);
        }
        if (py) {
            cells.push([cx, cy+1]);
        }
        if (nx) {
            cells.push([cx-1, cy]);
        }
        if (ny) {
            cells.push([cx, cy-1]);
        }
        if (nx && ny) {
            cells.push([cx-1, cy-1]);
        }
        if (px && py) {
            cells.push([cx+1, cy+1]);
        }
        if (nx && py) {
            cells.push([cx-1, cy+1]);
        }
        if (px && ny) {
            cells.push([cx+1, cy-1]);
        }
        return cells.filter(function(cell) {
            // remove cells outside tile (shouldn't occur?)
            var x = cell[0];
            var y = cell[1];
            return x >= 0 && x < numCells && y >= 0 && y < numCells;
        }).map(function(cell) {
            // hash
            return cell[0] + ':' + cell[1];
        });
    }

    function circleCollision(x, y, origin, radius) {
        var dx = x - origin.x;
        var dy = y - origin.y;
        var distSqr = (dx * dx) + (dy * dy);
        if (distSqr < (radius * radius)) {
            return true;
        }
        return false;
    }

    var MacroMicro = Canvas.extend({

        includes: [
            // mixins
            ColorRamp,
            ValueTransform
        ],

        options: {
            selectedFillColor: '#ff0000',
            selectedStrokeColor: '#ffffff',
            strokeColor: '#ffffff',
            strokeWidth: 1
        },

        selected: null,

        initialize: function() {
            if (!this.layers.micro || !this.layers.macro) {
                throw 'MacroMicro renderer requires `micro` and `macro` sub-layers';
            }
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
        },

        onAdd: function(map) {
            Canvas.prototype.onAdd.call(this, map);
            map.on('zoomend', this.onZoom, this);
        },

        onRemove: function(map) {
            Canvas.prototype.onRemove.call(this, map);
            map.off('zoomend', this.onZoom, this);
        },

        onZoom: function() {
            // clear selected on zoom
            this.selected = null;
        },

        _updateSelection: function(canvases, points, point) {
            // save selection
            this.selected = {
                points: points,
                point: point,
                canvases: canvases
            };
            var self = this;
            canvases.forEach(function(canvas) {
                // render tile
                self.renderMicroCanvas(canvas, points, point);
            });
        },

        clearSelection: function() {
            if (this.selected) {
                var self = this;
                this.selected.canvases.forEach(function(canvas) {
                    // render tile
                    self.renderMicroCanvas(canvas, self.selected.points);
                });
                this.selected = null;
            }
        },

        getTileCollisions: function(coord, tx, ty, pointRadius) {
            // spatial hash key
            var nb = pointRadius;
            var pb = TILE_SIZE + pointRadius;
            // tile coords
            var cx = coord.x;
            var cy = coord.y;
            var cz = coord.z;
            // buffer check bools
            var px = tx > pb;
            var nx = tx < nb;
            var py = ty > pb;
            var ny = ty < nb;
            // get tx pixel coords in adjecnt tiles
            var ptx, ntx, pty, nty;
            // get all possible tiles that could overlap point
            var tiles = [
                { x: cx, y: cy, z: cz, tx: tx, ty: ty }
            ];
            if (px) {
                ptx = tx - (TILE_SIZE - pointRadius);
                tiles.push({ x: cx+1, y: cy, z: cz, tx: ptx, ty: ty });
            }
            if (py) {
                pty = ty - (TILE_SIZE - pointRadius);
                tiles.push({ x: cx, y: cy+1, z: cz, tx: tx, ty: pty });
            }
            if (nx) {
                ntx = tx + (TILE_SIZE + pointRadius);
                tiles.push({ x: cx-1, y: cy, z: cz, tx: ntx, ty: ty });
            }
            if (ny) {
                nty = ty + (TILE_SIZE + pointRadius);
                tiles.push({ x: cx, y: cy-1, z: cz, tx: tx, ty: nty });
            }
            if (nx && ny) {
                tiles.push({ x: cx-1, y: cy-1, z: cz, tx: ntx, ty: nty });
            }
            if (px && py) {
                tiles.push({ x: cx+1, y: cy+1, z: cz, tx: ptx, ty: pty });
            }
            if (nx && py) {
                tiles.push({ x: cx-1, y: cy+1, z: cz, tx: ntx, ty: pty });
            }
            if (px && ny) {
                tiles.push({ x: cx+1, y: cy-1, z: cz, tx: ptx, ty: nty });
            }
            return tiles;
        },

        checkTileCollision: function(coord, highlight) {
            // point radius
            var pointRadius = this._getPointRadius();
            // get cache key
            var nkey = this.cacheKeyFromCoord(coord, true);
            var cached = this._cache[nkey];
            if (cached && cached.spatialHash) {
                // get tile coords
                var tx = coord.tx;
                var ty = coord.ty;
                // spatial hash key
                var hash = getHash(tx, ty, pointRadius);
                // get points in bin
                var points = cached.spatialHash[hash];
                if (points) {
                    // find first intersecting point in the bin
                    var point, i;
                    for (i=0; i<points.length; i++) {
                        point = points[i];
                        // check for collision
                        if (circleCollision(tx, ty, point, pointRadius)) {
                            // draw selection
                            if (highlight) {
                                this._updateSelection(
                                    _.values(cached.tiles),
                                    cached.points,
                                    point);
                            }
                            // return collision object
                            return {
                                value: point.hit,
                                x: coord.x,
                                y: coord.z,
                                z: coord.z,
                                type: 'macro_micro',
                                layer: this
                            };
                        }
                    }
                }
            }
        },

        onClick: function(e) {
            var canvas = e.originalEvent.target;
            var target = $(canvas);
            // re-render without selection
            this.clearSelection();
            // get layer coord
            var layerPixel = this._getLayerPointFromEvent(e.originalEvent);
            // get tile coord
            var coord = this._getTileCoordFromLayerPoint(layerPixel);
            // get tile pixel coord
            var tx = Math.floor(layerPixel.x % TILE_SIZE);
            var ty = Math.floor(layerPixel.y % TILE_SIZE);
            // spatial hash key
            var pointRadius = this._getPointRadius();
            // get all possible tiles that could collide
            var tiles = this.getTileCollisions(coord, tx, ty, pointRadius);
            console.log(tiles);
            var tile, collision, i;
            for (i=0; i<tiles.length; i++) {
                tile = tiles[i];
                collision = this.checkTileCollision(tile, true);
                if (collision) {
                    // execute callback
                    if (this.options.handlers.click) {
                        this.options.handlers.click(target, collision);
                    }
                    return;
                }
            }
        },

        onMouseMove: function(e) {
            var canvas = e.originalEvent.target;
            var target = $(canvas);
            // get layer coord
            var layerPixel = this._getLayerPointFromEvent(e.originalEvent);
            // get tile coord
            var coord = this._getTileCoordFromLayerPoint(layerPixel);
            // get tile pixel coord
            var tx = Math.floor(layerPixel.x % TILE_SIZE);
            var ty = Math.floor(layerPixel.y % TILE_SIZE);
            // spatial hash key
            var pointRadius = this._getPointRadius();
            // get all possible tiles that could collide
            var tiles = this.getTileCollisions(coord, tx, ty, pointRadius);
            var tile, collision, i;
            for (i=0; i<tiles.length; i++) {
                tile = tiles[i];
                collision = this.checkTileCollision(tile, false);
                if (collision) {
                    // execute callback
                    if (this.options.handlers.mousemove) {
                        this.options.handlers.mousemove(target, collision);
                    }
                    // set cursor
                    $(target).css('cursor', 'pointer');
                    return;
                }
            }
            // set cursor
            $(target).css('cursor', '');

            /*
            var target = $(e.originalEvent.target);
            // get layer coord
            var layerPixel = this._getLayerPointFromEvent(e);
            // get tile coord
            var coord = this._getTileCoordFromLayerPoint(layerPixel);
            // get cache key
            var nkey = this.cacheKeyFromCoord(coord, true);
            // get cache entry
            var cached = this._cache[nkey];
            if (cached && cached.spatialHash) {
                // pixel in tile coords
                var tx = Math.floor(layerPixel.x % TILE_SIZE);
                var ty = Math.floor(layerPixel.y % TILE_SIZE);
                // spatial hash key
                var pointRadius = this._getPointRadius();
                var hash = getHash(tx, ty, pointRadius);
                // get points in bin
                var points = cached.spatialHash[hash];
                if (points) {
                    // find first intersecting point in the bin
                    var point, i;
                    for (i=0; i<points.length; i++) {
                        point = points[i];
                        // check for collision
                        if (circleCollision(tx, ty, point, pointRadius)) {
                            // execute callback
                            if (this.options.handlers.mousemove) {
                                this.options.handlers.mousemove(target, {
                                    value: point.hit,
                                    x: coord.x,
                                    y: coord.z,
                                    z: coord.z,
                                    type: 'macro_micro',
                                    layer: this
                                });
                            }
                            // set cursor
                            $(target).css('cursor', 'pointer');
                            return;
                        }
                    }
                }
            }
            if (this.options.handlers.mousemove) {
                this.options.handlers.mousemove(target, null);
            }
            // set cursor
            $(target).css('cursor', '');
            */
        },

        renderMacroCanvas: function(bins, resolution, ramp) {
            var canvas = document.createElement('canvas');
            canvas.height = resolution;
            canvas.width = resolution;
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, resolution, resolution);
            var data = imageData.data;
            var self = this;
            var color = [0, 0, 0, 0];
            var nval, rval, bin, i;
            for (i=0; i<bins.length; i++) {
                bin = bins[i];
                if (bin === 0) {
                    color[0] = 0;
                    color[1] = 0;
                    color[2] = 0;
                    color[3] = 0;
                } else {
                    nval = self.transformValue(bin);
                    rval = self.interpolateToRange(nval);
                    ramp(rval, color);
                }
                data[i * 4] = color[0];
                data[i * 4 + 1] = color[1];
                data[i * 4 + 2] = color[2];
                data[i * 4 + 3] = color[3];
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        },

        _getPointRadius: function() {
            return Math.max(1, (TILE_SIZE / this.layers.micro.getResolution()) / 2);
        },

        _getFillColor: function() {
            var color = [0, 0, 0, 0];
            this.getColorRamp()(0.5, color);
            return 'rgba('+color[0]+','+color[1]+','+color[2]+', 0.5)';
        },

        renderMicroCanvas: function(canvas, points, selectedPixel) {
            var fillColor = this._getFillColor();
            var strokeColor = this.options.strokeColor;
            var strokeWidth = this.options.strokeWidth;
            var pointRadius = this._getPointRadius();
            var bufferRadius = pointRadius + strokeWidth;
            var bufferDiameter = bufferRadius * 2;
            // buffer the canvas so that none of the points are cut off
            // ensure the DOM size is the same as the canvas
            $(canvas).css({
                'width': TILE_SIZE + bufferDiameter,
                'height': TILE_SIZE + bufferDiameter,
                'margin-top': -bufferRadius,
                'margin-left': -bufferRadius
            });
            // double the resolution if on a hi-res display
            var devicePixelFactor = (L.Browser.retina) ? 2 : 1;
            canvas.width = (TILE_SIZE + bufferDiameter) * devicePixelFactor;
            canvas.height = (TILE_SIZE + bufferDiameter) * devicePixelFactor;
            // get 2d context
            var ctx = canvas.getContext('2d');
            // additive blending
            ctx.globalCompositeOperation = 'lighter';
            // draw each point
            points.forEach(function(pixel) {
                ctx.beginPath();
                ctx.fillStyle = fillColor;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.arc(
                    (bufferRadius + pixel.x) * devicePixelFactor,
                    (bufferRadius + pixel.y) * devicePixelFactor,
                    pointRadius * devicePixelFactor,
                    0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });
            // default blending
            ctx.globalCompositeOperation = 'source-over';
            // draw selected point
            if (selectedPixel) {
                ctx.beginPath();
                ctx.fillStyle = this.options.selectedFillColor;
                ctx.strokeStyle = this.options.selectedStrokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.arc(
                    (bufferRadius + selectedPixel.x) * devicePixelFactor,
                    (bufferRadius + selectedPixel.y) * devicePixelFactor,
                    pointRadius * devicePixelFactor,
                    0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        },

        extractExtrema: function(res) {
            if (res.type === 'macro') {
                var bins = new Float64Array(res.data);
                return {
                    min: _.min(bins),
                    max: _.max(bins)
                };
            }
            return {
                min: Infinity,
                max: -Infinity
            };
        },

        renderTile: function(canvas, res, coords) {
            if (!res) {
                return;
            }
            var type = res.type;
            var data = res.data;
            if (type === 'macro') {
                // macro
                var bins = new Float64Array(data);
                var resolution = Math.sqrt(bins.length);
                var ramp = this.getColorRamp();
                var tileCanvas = this.renderMacroCanvas(bins, resolution, ramp);
                var ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    tileCanvas,
                    0, 0,
                    resolution, resolution,
                    0, 0,
                    canvas.width, canvas.height);
            } else {
                // micro
                // modify cache entry
                var nkey = this.cacheKeyFromCoord(coords, true);
                var cached = this._cache[nkey];
                // check if pixel locations have been cached
                if (!cached.points || !cached.spatialHash) {
                    // convert x / y to tile pixels
                    var micro = this.layers.micro;
                    var xField = micro.getXField();
                    var yField = micro.getYField();
                    var zoom = coords.z;
                    var pointRadius = this._getPointRadius();
                    var points = [];
                    var spatialHash = {};
                    // calc pixel locations
                    data.forEach(function(hit) {
                        var x = _.get(hit, xField);
                        var y = _.get(hit, yField);
                        if (x !== undefined && y !== undefined) {
                            var layerPixel = micro.getLayerPointFromDataPoint(x, y, zoom);
                            // pixel in tile coords
                            var tx = Math.floor(layerPixel.x % TILE_SIZE);
                            var ty = Math.floor(layerPixel.y % TILE_SIZE);
                            // create pixel
                            var point = {
                                x: tx,
                                y: ty,
                                hit: hit
                            };
                            points.push(point);
                            // spatial hash key
                            var hashes = getHashes(tx, ty, pointRadius);
                            // add pixel to hash
                            hashes.forEach(function(hash) {
                                spatialHash[hash] = spatialHash[hash] || [];
                                spatialHash[hash].push(point);
                            });
                        }
                    });
                    // store in cache
                    cached.points = points;
                    cached.spatialHash = spatialHash;
                }
                // render the tile
                this.renderMicroCanvas(canvas, cached.points);
            }
        }

    });

    module.exports = MacroMicro;

}());
