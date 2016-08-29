(function() {

    'use strict';

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    let Base = L.GridLayer.extend({

        options: {
            tms: false
        },

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

        isTargetLayer: function(elem) {
            return this._container && this._container === elem || $.contains(this._container, elem);
        },

        _getLayerPointFromLonLat: function(lonlatPoint, zoom) {
            zoom = (zoom !== undefined) ? zoom : this._map.getZoom();
            let pixel = this._map.project(lonlatPoint, zoom);
            let pow = Math.pow(2, zoom);
            let tileSize = this.options.tileSize;
            return {
                x: mod(pixel.x, pow * tileSize),
                y: mod(pixel.y, pow * tileSize)
            };
        },

        getLayerPointFromEvent: function(e) {
            let lonlat = this._map.mouseEventToLatLng(e);
            return this._getLayerPointFromLonLat(lonlat);
        },

        getTileCoordFromLayerPoint: function(layerPoint) {
            let tileSize = this.options.tileSize;
            return {
                x: Math.floor(layerPoint.x / tileSize),
                y: Math.floor(layerPoint.y / tileSize),
                z: this._map.getZoom()
            };
        },

        getBinCoordFromLayerPoint: function(layerPoint, res) {
            let tileSize = this.options.tileSize;
            let resolution = res || this.getResolution() || tileSize;
            let tx = mod(layerPoint.x, tileSize);
            let y = this.options.tms ? resolution - layerPoint.y : layerPoint.y;
            let ty = mod(y, tileSize);
            let pixelSize = tileSize / resolution;
            let bx = Math.floor(tx / pixelSize);
            let by = Math.floor(ty / pixelSize);
            return {
                x: bx,
                y: by,
                index: bx + (by * resolution),
                size: pixelSize
            };
        },

        _addTile: function(coords, container) {
            let tilePos = this._getTilePos(coords);
            let key = this._tileCoordsToKey(coords);
            // Override so that we don't pass in wrapped coords here
            let tile = this.createTile(coords, L.bind(this._tileReady, this, coords));
            this._initTile(tile);
            // if createTile is defined with a second argument ("done" callback),
            // we know that tile is async and will be ready later; otherwise
            if (this.createTile.length < 2) {
                // mark tile as ready, but delay one frame for opacity animation to happen
                L.Util.requestAnimFrame(L.bind(this._tileReady, this, coords, null, tile));
            }
            L.DomUtil.setPosition(tile, tilePos);
            // save tile in cache
            this._tiles[key] = {
                el: tile,
                coords: coords,
                current: true
            };
            container.appendChild(tile);
            // @event tileloadstart: TileEvent
            // Fired when a tile is requested and starts loading.
            this.fire('tileloadstart', {
                tile: tile,
                coords: coords
            });
        }
    });

    module.exports = Base;

}());
