(function() {

    'use strict';

    var Tile = require('../../layer/core/Tile');

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    function getNormalizeCoords(coords) {
        var pow = Math.pow(2, coords.z);
        return {
            x: mod(coords.x, pow),
            y: mod(coords.y, pow),
            z: coords.z
        };
    }

    var DOM = Tile.extend({

        onAdd: function(map) {
            L.TileLayer.prototype.onAdd.call(this, map);
            map.on('zoomstart', this.clearExtrema, this);
            this.on('tileload', this.onTileLoad, this);
            this.on('tileunload', this.onTileUnload, this);
        },

        onRemove: function(map) {
            map.off('zoomstart', this.clearExtrema, this);
            this.off('tileload', this.onTileLoad, this);
            this.off('tileunload', this.onTileUnload, this);
            L.TileLayer.prototype.onRemove.call(this, map);
        },

        onTileUnload: function(event) {
            // cache key from coords
            var key = this._cacheKeyFromCoord(event.coords);
            // cache key from normalized coords
            var nkey = this._cacheKeyFromCoord(event.coords, true);
            // get cache entry
            var cached = this._cache[nkey];
            // could the be case where the cache is cleared before tiles are
            // unloaded
            if (!cached) {
                return;
            }
            // remove the tile from the cache
            delete cached.tiles[key];
            if (_.keys(cached.tiles).length === 0) {
                // no more tiles use this cached data, so delete it
                delete this._cache[key];
            }
        },

        onTileLoad: function(event) {
            var self = this;
            var coords = event.coords;
            var ncoords = getNormalizeCoords(event.coords);
            var tile = event.tile;
            // cache key from coords
            var key = this._cacheKeyFromCoord(event.coords);
            // cache key from normalized coords
            var nkey = this._cacheKeyFromCoord(event.coords, true);
            // check cache
            var cached = this._cache[nkey];
            if (cached) {
                if (cached.isPending) {
                    // currently pending
                    // store the tile in the cache to draw to later
                    cached.tiles[key] = tile;
                } else {
                    // already requested
                    // store the tile in the cache
                    cached.tiles[key] = tile;
                    // draw the tile
                    self.renderTile(tile, cached.data, coords);
                }
            } else {
                // create a cache entry
                this._cache[nkey] = {
                    isPending: true,
                    tiles: {},
                    data: null
                };
                // add tile to the cache entry
                this._cache[nkey].tiles[key] = tile;
                // request the tile
                this.requestTile(ncoords, function(data) {
                    var cached = self._cache[nkey];
                    if (!cached) {
                        // tile is no longer being tracked, ignore
                        return;
                    }
                    cached.isPending = false;
                    cached.data = data;
                    // update the extrema
                    if (data && self.updateExtrema(data)) {
                        // extrema changed, redraw all tiles
                        _.forIn(self._cache, function(cached) {
                            _.forIn(cached.tiles, function(tile, key) {
                                if (cached.data) {
                                    self.renderTile(tile, cached.data, self._coordFromCacheKey(key));
                                }
                            });
                        });
                    } else {
                        // same extrema, we are good to render the tiles. In
                        // the case of a map with wraparound, we may have
                        // multiple tiles dependent on the response, so iterate
                        // over each tile and draw it.
                        _.forIn(cached.tiles, function(tile) {
                            self.renderTile(tile, data, coords);
                        });
                    }
                });
            }
        },

        _cacheKeyFromCoord: function(coords, normalize) {
            if (normalize) {
                // leaflet layer x and y may be > n^2, and < 0 in the case
                // of a wraparound. If normalize is true, mod the coords
                coords = getNormalizeCoords(coords);
            }
            return coords.z + ':' + coords.x + ':' + coords.y;
        },

        _coordFromCacheKey: function(key) {
            var arr = key.split(':');
            return {
                x: parseInt(arr[1], 10),
                y: parseInt(arr[2], 10),
                z: parseInt(arr[0], 10)
            };
        },

        _getLayerPointFromEvent: function(e) {
            var lonlat = this._map.mouseEventToLatLng(e);
            var pixel = this._map.project(lonlat);
            var zoom = this._map.getZoom();
            var pow = Math.pow(2, zoom);
            var tileSize = this.options.tileSize;
            return {
                x: mod(pixel.x, pow * tileSize),
                y: mod(pixel.y, pow * tileSize)
            };
        },

        _getTileCoordFromLayerPoint: function(layerPoint) {
            var tileSize = this.options.tileSize;
            return {
                x: Math.floor(layerPoint.x / tileSize),
                y: Math.floor(layerPoint.y / tileSize),
                z: this._map.getZoom()
            };
        },

        _getBinCoordFromLayerPoint: function(layerPoint) {
            var tileSize = this.options.tileSize;
            var resolution = this.getResolution() || tileSize;
            var tx = mod(layerPoint.x, tileSize);
            var ty = mod(layerPoint.y, tileSize);
            var pixelSize = tileSize / resolution;
            var bx = Math.floor(tx / pixelSize);
            var by = Math.floor(ty / pixelSize);
            return {
                x: bx,
                y: by,
                index: bx + (by * resolution),
                size: pixelSize
            };
        },

        createTile: function() {
            // override
        },

        requestTile: function() {
            // override
        },

        renderTile: function() {
            // override
        }

    });

    module.exports = DOM;

}());
