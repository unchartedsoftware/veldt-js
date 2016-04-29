(function() {

    'use strict';

    var HTML = require('../../core/HTML');

    var TILE_SIZE = 256;
    var DEFAULT_RESOLUTION = 256;
    var DOWN_SAMPLE = 8;
    var ORIGIN_LAT_LON = new L.LatLng(85.05115, -180);

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    var TopTrails = HTML.extend({

        trails: {},

        pixels: {},

        clearTrails: function() {
            this.trails = {};
            this.pixels = {};
        },

        onAdd: function(map) {
            HTML.prototype.onAdd.call(this, map);
            map.on('zoomstart', this.clearTrails, this);
        },

        onRemove: function(map) {
            map.off('zoomstart', this.clearTrails, this);
            HTML.prototype.onRemove.call(this, map);
        },

        isTargetLayer: function( elem ) {
            return this._container && $.contains(this._container, elem);
        },

        onMouseMove: function(e) {
            // clear existing highlight
            var ll = this._map.mouseEventToLatLng(e);
            var pixel = this._map.project(ll);
            var pow = Math.pow(2, this._map.getZoom());
            var resolution = this.getResolution() || DEFAULT_RESOLUTION;
            var pixelSize = TILE_SIZE / resolution;
            var downSample = pixelSize * DOWN_SAMPLE;
            // get native pixel coords
            var nx = mod(pixel.x, pow * DEFAULT_RESOLUTION);
            var ny = mod(pixel.y, pow * DEFAULT_RESOLUTION);
            // get render pixel coords
            var x = Math.floor(nx / downSample);
            var y = Math.floor(ny / downSample);
            $(this._tileContainer).find('.top-trail-highlight').remove();
            if (this.pixels[x] && this.pixels[x][y]) {
                var ids = Object.keys( this.pixels[x][y] );
                var origin = this._map.latLngToLayerPoint(ORIGIN_LAT_LON);
                var $highlight = this._highlightTrail(origin, ids[0]);
                $(this._tileContainer).append($highlight);
            }
        },

        _highlightTrail: function(origin, id) {
            var resolution = this.getResolution() || DEFAULT_RESOLUTION;
            var pixelSize = TILE_SIZE / resolution;
            var left, top;
            var i;
            var pixels = this.trails[id];
            var pixel;
            var $highlight = $('<div class="top-trail-highlight" ' +
                'style="left:' + origin.x + 'px;' +
                'top:' + origin.y + 'px;"></div>');
            for (i=0; i<pixels.length; i++) {
                pixel = pixels[i];
                left = pixel[0];
                top = pixel[1];
                $highlight.append('<div class="top-trail-pixel" ' +
                    'style="' +
                    'height:' + pixelSize + 'px;' +
                    'width:' + pixelSize + 'px;' +
                    'left:' + left + 'px;' +
                    'top:' + top + 'px;"></div>');
            }
            return $highlight;
        },

        renderTile: function(container, data, coord) {
            if (!data) {
                return;
            }
            var trails = this.trails;
            var pixels = this.pixels;
            var resolution = this.getResolution() || DEFAULT_RESOLUTION;
            var pixelSize = TILE_SIZE / resolution;
            var ids  = Object.keys(data);
            var bins, bin;
            var id, i, j;
            var downRes, rx, ry, x, y;
            for (i=0; i<ids.length; i++) {
                id = ids[i];
                bins = data[id];
                for (j=0; j<bins.length; j++) {
                    bin = bins[j];
                    downRes = resolution / DOWN_SAMPLE;
                    rx = (coord.x * downRes) + Math.floor(bin[0] / DOWN_SAMPLE);
                    ry = (coord.y * downRes) + Math.floor(bin[1] / DOWN_SAMPLE);
                    pixels[rx] = pixels[rx] || {};
                    pixels[rx][ry] = pixels[rx][ry] || {};
                    // TODO: prevent duplicates
                    pixels[rx][ry][id] = true;
                    x = (coord.x * TILE_SIZE) + (bin[0] * pixelSize);
                    y = (coord.y * TILE_SIZE) + (bin[1] * pixelSize);
                    // add pixel under the trail at NATIVE resolution
                    trails[id] = trails[id] || [];
                    trails[id].push([ x, y ]);
                }
            }
            $( container ).css('pointer-events', 'all');
        }

    });

    module.exports = TopTrails;

}());
