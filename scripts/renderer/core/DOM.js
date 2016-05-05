(function() {

    'use strict';

    var Base = require('../../layer/core/Base');

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    var DOM = Base.extend({

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
