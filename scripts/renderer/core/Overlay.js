(function() {

    'use strict';

    const Base = require('../../layer/core/Base');

    const NO_OP = function() {};

    const Overlay = Base.extend({

        options: {
            zIndex: 1
        },

        onAdd: function(map) {
            this.on('tileunload', this.onTileUnload, this);
            this.on('cacheload', this.onCacheLoad, this);
            this.on('cachehit', this.onCacheHit, this);
            this.on('cacheunload', this.onCacheUnload, this);
            this.on('extremachange', this.onExtremaChange, this);
            this._tiles = {};
            this._initContainer();
            // add event handlers
            map.on('click', this.onClick, this);
            map.on('mousemove', this.onMouseMove, this);
            this._resetView();
            this._update();
        },

        onRemove: function(map) {
            // remove layer
            this._removeAllTiles();
            L.DomUtil.remove(this._container);
            map._removeZoomLimit(this);
            this._tileZoom = null;
            // remove handlers
            this.off('tileunload', this.onTileUnload, this);
            this.off('cacheload', this.onCacheLoad, this);
            this.off('cachehit', this.onCacheHit, this);
            this.off('cacheunload', this.onCacheUnload, this);
            this.off('extremachange', this.onExtremaChange, this);
            map.off('click', this.onClick, this);
            map.off('mousemove', this.onMouseMove, this);
        },

        // No-op these functions
        _updateOpacity: NO_OP,
        _initTile: NO_OP,
        _updateLevels: NO_OP,
        _removeTilesAtZoom: NO_OP,
        _setZoomTransforms: NO_OP,

        _initContainer: function() {
            if (!this._container) {
                this._container = document.createElement('canvas');
                this._container.className += 'leaflet-layer leaflet-zoom-animated';
            }
            this._updateZIndex();
            this.getPane().appendChild(this._container);
        },

        _pruneTiles: function() {
            if (!this._map) {
                return;
            }
            const zoom = this._map.getZoom();
            if (zoom > this.options.maxZoom ||
                zoom < this.options.minZoom) {
                this._removeAllTiles();
                return;
            }
            _.forIn(this._tiles, tile => {
                tile.retain = tile.current;
            });
            _.forIn(this._tiles, tile => {
                if (tile.current && !tile.active) {
                    const coords = tile.coords;
                    if (!this._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) {
                        this._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
                    }
                }
            });
            _.forIn(this._tiles, (tile, key) => {
                if (!tile.retain) {
                    this._removeTile(key);
                }
            });
        },

        _removeAllTiles: function() {
            _.forIn(this._tiles, (tile, key) => {
                this._removeTile(key);
            });
        },

        _invalidateAll: function() {
            this._removeAllTiles();
            this._tileZoom = null;
        },

        _setView: function(center, zoom, noPrune, noUpdate) {
            let tileZoom = Math.round(zoom);
            if ((this.options.maxZoom !== undefined && tileZoom > this.options.maxZoom) ||
                (this.options.minZoom !== undefined && tileZoom < this.options.minZoom)) {
                tileZoom = undefined;
            }
            const tileZoomChanged = this.options.updateWhenZooming && (tileZoom !== this._tileZoom);
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

        _setZoomTransform: function(center, zoom) {
            const currentCenter = this._map.getCenter();
            const currentZoom = this._map.getZoom();
            const scale = this._map.getZoomScale(zoom, currentZoom);
            const position = L.DomUtil.getPosition(this._container);
            const viewHalf = this._map.getSize().multiplyBy(0.5);
            const currentCenterPoint = this._map.project(currentCenter, zoom);
            const destCenterPoint = this._map.project(center, zoom);
            const centerOffset = destCenterPoint.subtract(currentCenterPoint);
            const topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);
            if (L.Browser.any3d) {
                L.DomUtil.setTransform(this._container, topLeftOffset, scale);
            } else {
                L.DomUtil.setPosition(this._container, topLeftOffset);
            }
        },

        // Private method to load tiles in the grid's active zoom level according to map bounds
        _update: function(center) {
            const map = this._map;
            if (!map) {
                return;
            }
            const zoom = map.getZoom();
            if (center === undefined) {
                center = map.getCenter();
            }
            if (this._tileZoom === undefined) {
                // if out of minzoom/maxzoom
                return;
            }
            const pixelBounds = this._getTiledPixelBounds(center),
                tileRange = this._pxBoundsToTileRange(pixelBounds),
                tileCenter = tileRange.getCenter(),
                queue = [];

            _.forIn(this._tiles, tile => {
                tile.current = false;
            });
            // _update just loads more tiles. If the tile zoom level differs too much
            // from the map's, const _setView reset levels and prune old tiles.
            if (Math.abs(zoom - this._tileZoom) > 1) {
                this._setView(center, zoom);
                return;
            }
            // create a queue of coordinates to load tiles from
            for (let j = tileRange.min.y; j <= tileRange.max.y; j++) {
                for (let i = tileRange.min.x; i <= tileRange.max.x; i++) {
                    const coords = new L.Point(i, j);
                    coords.z = this._tileZoom;

                    if (!this._isValidTile(coords)) {
                        continue;
                    }

                    const tile = this._tiles[this._tileCoordsToKey(coords)];
                    if (tile) {
                        tile.current = true;
                    } else {
                        queue.push(coords);
                    }
                }
            }
            // sort tile queue to load tiles in order of their distance to center
            queue.sort((a, b) => {
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
                for (let i = 0; i < queue.length; i++) {
                    this._addTile(queue[i]);
                }
            }
        },

        _removeTile: function(key) {
            const tile = this._tiles[key];
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

        createTile: function(coords, done) {
            const tile = {
                coords: coords,
                current: true
            };
            this._requestTile(coords, tile, () => {
                done(null, tile);
            });
            return tile;
        },

        _addTile: function(coords) {

            const tile = this.createTile(coords, L.bind(this._tileReady, this, coords));
            const key = this._tileCoordsToKey(coords);
            this._tiles[key] = tile;

            // @event tileloadstart: TileEvent
            // Fired when a tile is requested and starts loading.
            this.fire('tileloadstart', {
                coords: coords
            });
        },

        _tileReady: function(coords, err, tile) {
            if (!this._map) {
                return;
            }
            if (err) {
                // @event tileerror: TileErrorEvent
                // Fired when there is an error loading a tile.
                this.fire('tileerror', {
                    error: err,
                    tile: tile,
                    coords: coords
                });
            }
            // tile loaded
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
        },

        onCacheHit: function() {
            // override
        },

        onCacheLoad: function() {
            // override
        },

        onExtremaChange: function() {
            // override
        },

        onCacheUnload: function() {
            // override
        },

        onMouseMove: function() {
            // override
        },

        onClick: function() {
            // override
        }

    });

    module.exports = Overlay;

}());
