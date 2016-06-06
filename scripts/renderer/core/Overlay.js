(function() {

    'use strict';

    var Base = require('../../layer/core/Base');

    var NO_OP = function() {};

    var Overlay = Base.extend({

        options: {
            zIndex: 1
        },

        onAdd: function() {
            this.on('tileload', this.onTileLoad, this);
            this.on('tileunload', this.onTileUnload, this);
            this._tiles = {};
            this._initContainer();
            this._resetView();
            this._update();
        },

        onRemove: function(map) {
            this.off('tileload', this.onTileLoad, this);
            this.off('tileunload', this.onTileUnload, this);
            this._removeAllTiles();
            L.DomUtil.remove(this._container);
            map._removeZoomLimit(this);
            this._tileZoom = null;
        },

        // No-op these functions
        createTile: NO_OP,
        _updateOpacity: NO_OP,
        _initTile: NO_OP,
        _tileReady: NO_OP,
        _updateLevels: NO_OP,
        _removeTilesAtZoom: NO_OP,
        _setZoomTransforms: NO_OP,

        _initContainer: function () {
            if (!this._container) {
                this._container = document.createElement('canvas');
                this._container.className += 'leaflet-layer leaflet-zoom-animated';
            }
            this._updateZIndex();
            this.getPane().appendChild(this._container);
        },

        _pruneTiles: function () {
            if (!this._map) {
                return;
            }
            var zoom = this._map.getZoom();
            if (zoom > this.options.maxZoom ||
                zoom < this.options.minZoom) {
                this._removeAllTiles();
                return;
            }
            var self = this;
            _.forIn(this._tiles, function(tile) {
                tile.retain = tile.current;
            });
            _.forIn(this._tiles, function(tile) {
                if (tile.current && !tile.active) {
                    var coords = tile.coords;
                    if (!self._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) {
                        self._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
                    }
                }
            });
            _.forIn(this._tiles, function(tile, key) {
                if (!tile.retain) {
                    self._removeTile(key);
                }
            });
        },

        _removeAllTiles: function () {
            var self = this;
            _.forIn(this._tiles, function(tile, key) {
                self._removeTile(key);
            });
        },

        _invalidateAll: function () {
            this._removeAllTiles();
            this._tileZoom = null;
        },

        _setView: function (center, zoom, noPrune, noUpdate) {
            var tileZoom = Math.round(zoom);
            if ((this.options.maxZoom !== undefined && tileZoom > this.options.maxZoom) ||
                (this.options.minZoom !== undefined && tileZoom < this.options.minZoom)) {
                tileZoom = undefined;
            }
            var tileZoomChanged = this.options.updateWhenZooming && (tileZoom !== this._tileZoom);
            if (!noUpdate || tileZoomChanged) {
                this._tileZoom = tileZoom;
                if (this._abortLoading) {
                    this._abortLoading();
                }
                this._resetGrid();
                if (tileZoom !== undefined) {
                    this._update(center);
                }
                if (!noPrune) {
                    this._pruneTiles();
                }
            }
            this._setZoomTransform(center, zoom);
        },

        _setZoomTransform: function (center, zoom) {
            var currentCenter = this._map.getCenter();
            var currentZoom = this._map.getZoom();
            var scale = this._map.getZoomScale(zoom, currentZoom);
            var position = L.DomUtil.getPosition(this._container);
            var viewHalf = this._map.getSize().multiplyBy(0.5);
            var currentCenterPoint = this._map.project(currentCenter, zoom);
            var destCenterPoint = this._map.project(center, zoom);
            var centerOffset = destCenterPoint.subtract(currentCenterPoint);
            var topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);
            if (L.Browser.any3d) {
                L.DomUtil.setTransform(this._container, topLeftOffset, scale);
            } else {
                L.DomUtil.setPosition(this._container, topLeftOffset);
            }
        },

        // Private method to load tiles in the grid's active zoom level according to map bounds
        _update: function (center) {
            var map = this._map;
            if (!map) {
                return;
            }
            var zoom = map.getZoom();
            if (center === undefined) {
                center = map.getCenter();
            }
            if (this._tileZoom === undefined) {
                // if out of minzoom/maxzoom
                return;
            }
            var pixelBounds = this._getTiledPixelBounds(center),
                tileRange = this._pxBoundsToTileRange(pixelBounds),
                tileCenter = tileRange.getCenter(),
                queue = [];

            _.forIn(this._tiles, function(tile) {
                tile.current = false;
            });
            // _update just loads more tiles. If the tile zoom level differs too much
            // from the map's, let _setView reset levels and prune old tiles.
            if (Math.abs(zoom - this._tileZoom) > 1) {
                this._setView(center, zoom);
                return;
            }
            // create a queue of coordinates to load tiles from
            var i, j;
            for (j = tileRange.min.y; j <= tileRange.max.y; j++) {
                for (i = tileRange.min.x; i <= tileRange.max.x; i++) {
                    var coords = new L.Point(i, j);
                    coords.z = this._tileZoom;

                    if (!this._isValidTile(coords)) {
                        continue;
                    }

                    var tile = this._tiles[this._tileCoordsToKey(coords)];
                    if (tile) {
                        tile.current = true;
                    } else {
                        queue.push(coords);
                    }
                }
            }
            // sort tile queue to load tiles in order of their distance to center
            queue.sort(function (a, b) {
                return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
            });
            if (queue.length !== 0) {
                // if its the first batch of tiles to load
                if (!this._loading) {
                    this._loading = true;
                    // @event loading: Event
                    // Fired when the grid layer starts loading tiles
                    this.fire('loading');
                }
                for (i = 0; i < queue.length; i++) {
                    this._addTile(queue[i]);
                }
            }
        },

        _removeTile: function (key) {
            var tile = this._tiles[key];
            if (!tile) {
                return;
            }
            delete this._tiles[key];
            // @event tileunload: TileEvent
            // Fired when a tile is removed (e.g. when a tile goes off the screen).
            this.fire('tileunload', {
                coords: this._keyToTileCoords(key)
            });
        },

        _addTile: function (coords) {
            var key = this._tileCoordsToKey(coords);
            // save tile in cache
            var tile = this._tiles[key] = {
                coords: coords,
                current: true
            };
            // @event tileloadstart: TileEvent
            // Fired when a tile is requested and starts loading.
            this.fire('tileloadstart', {
                coords: coords
            });

            tile.loaded = +new Date();
            tile.active = true;
            this._pruneTiles();

            // @event tileload: TileEvent
            // Fired when a tile loads.
            this.fire('tileload', {
                coords: coords,
                tile: tile
            });

            if (this._noTilesToLoad()) {
                this._loading = false;
                // @event load: Event
                // Fired when the grid layer loaded all visible tiles.
                this.fire('load');

                if (L.Browser.ielt9 || !this._map._fadeAnimated) {
                    L.Util.requestAnimFrame(this._pruneTiles, this);
                } else {
                    // Wait a bit more than 0.2 secs (the duration of the tile fade-in)
                    // to trigger a pruning.
                    setTimeout(L.bind(this._pruneTiles, this), 250);
                }
            }
        }

    });

    module.exports = Overlay;

}());
