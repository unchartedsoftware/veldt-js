(function() {

    'use strict';

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    var Base = L.GridLayer.extend({

        getOpacity: function() {
            return this.options.opacity;
        },

        show: function() {
            this._hidden = false;
            this._prevMap.addLayer(this);
        },

        hide: function() {
            this._hidden = true;
            this._prevMap = this._map;
            this._map.removeLayer(this);
        },

        isHidden: function() {
            return this._hidden;
        },

        setBrightness: function(brightness) {
            this._brightness = brightness;
            $(this._container).css('-webkit-filter', 'brightness(' + (this._brightness * 100) + '%)');
            $(this._container).css('filter', 'brightness(' + (this._brightness * 100) + '%)');
        },

        getBrightness: function() {
            return (this._brightness !== undefined) ? this._brightness : 1;
        },

        getLayerPointFromLonLat: function(lonlatPoint, zoom) {
            var pixel = this._map.project(lonlatPoint, zoom);
            var pow = Math.pow(2, zoom);
            var tileSize = this.options.tileSize;
            return {
                x: mod(pixel.x, pow * tileSize),
                y: mod(pixel.y, pow * tileSize)
            };
        },

        getLayerPointFromEvent: function(e) {
            var lonlat = this._map.mouseEventToLatLng(e);
            return this._getLayerPointFromLonLat(lonlat, this._map.getZoom());
        },

        getTileCoordFromLayerPoint: function(layerPoint) {
            var tileSize = this.options.tileSize;
            return {
                x: Math.floor(layerPoint.x / tileSize),
                y: Math.floor(layerPoint.y / tileSize),
                z: this._map.getZoom()
            };
        },

        getBinCoordFromLayerPoint: function(layerPoint, res) {
            var tileSize = this.options.tileSize;
            var resolution = res || this.getResolution() || tileSize;
            var tx = mod(layerPoint.x, tileSize);
            var y = this.options.tms ? resolution - layerPoint.y : layerPoint.y;
            var ty = mod(y, tileSize);
            var pixelSize = tileSize / resolution;
            var bx = Math.floor(tx / pixelSize);
            var by = Math.floor(ty / pixelSize);
            return {
                x: bx,
                y: by,
                index: bx + (by * resolution),
                size: pixelSize
            };
        }
    });

    module.exports = Base;

}());
