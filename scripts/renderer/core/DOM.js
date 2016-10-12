(function() {

    'use strict';

    const Base = require('../../layer/core/Base');

    const DOM = Base.extend({

        onAdd: function(map) {
            L.GridLayer.prototype.onAdd.call(this, map);
            map.on('zoomstart', this.clearExtrema, this);
            this.on('tileunload', this.onTileUnload, this);
            this.on('cacheload', this.onCacheLoad, this);
            this.on('cachehit', this.onCacheHit, this);
            this.on('cacheunload', this.onCacheUnload, this);
            this.on('extremachange', this.onExtremaChange, this);
        },

        onRemove: function(map) {
            L.GridLayer.prototype.onRemove.call(this, map);
            map.off('zoomstart', this.clearExtrema, this);
            this.off('tileunload', this.onTileUnload, this);
            this.off('cacheload', this.onCacheLoad, this);
            this.off('cachehit', this.onCacheHit, this);
            this.off('cacheunload', this.onCacheUnload, this);
            this.off('extremachange', this.onExtremaChange, this);
        },

        onCacheHit: function(event) {
            const cached = event.entry;
            const tile = event.tile;
            const coords = event.coords;
            // data exists, render only this tile
            if (cached.data) {
                this.renderTile(tile, cached.data, coords);
            }
        },

        onCacheLoad: function(event) {
            // same extrema, we are good to render the tiles. In
            // the case of a map with wraparound, we may have
            // multiple tiles dependent on the response, so iterate
            // over each tile and draw it.
            const cached = event.entry;
            const coords = event.coords;
            if (cached.data) {
                _.forIn(cached.tiles, tile => {
                    this.renderTile(tile, cached.data, coords);
                });
            }
        },

        onExtremaChange: function() {
            // redraw all tiles
            _.forIn(this._cache, cached => {
                _.forIn(cached.tiles, (tile, key) => {
                    if (cached.data) {
                        this.renderTile(
                            tile,
                            cached.data,
                            this.coordFromCacheKey(key));
                    }
                });
            });
        },

        onCacheUnload: function() {
            // override
        },

        createTile: function() {
            // override
        },

        renderTile: function() {
            // override
        }
    });

    module.exports = DOM;

}());
