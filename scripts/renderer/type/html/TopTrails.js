(function() {

    'use strict';

    var HTML = require('../../core/HTML');

    var TILE_SIZE = 256;
    var DEFAULT_RESOLUTION = 256;
    var DOWN_SAMPLE = 8;

    function mod(n, m) {
        return ( ( n % m ) + m ) % m;
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
            $(this._tileContainer).find('.trail-highlight').remove();
            if (this.pixels[x] && this.pixels[x][y]) {
                var ids = Object.keys( this.pixels[x][y] );
                var origin = this._map.latLngToLayerPoint(new L.LatLng(85.05115, -180));
                var $highlight = this._highlightTrail(origin, ids[0]);
                $(this._tileContainer).append($highlight);
            }
        },

        _highlightTrail: function(origin, id) {
            var resolution = this.getResolution() || DEFAULT_RESOLUTION;
            var pixelSize = TILE_SIZE / resolution;
            var color = [255, 0, 255, 1.0];
            var $highlight = $('<div class="trail-highlight" style="position:absolute; left:' + origin.x + 'px; top:' + origin.y + 'px;"></div>');
            var left, top;
            var i;
            var pixels = this.trails[id];
            var pixel;
            for (i=0; i<pixels.length; i++) {
                pixel = pixels[i];
                left = pixel[0];
                top = pixel[1];
                var rgba = 'rgba(' +
                    color[0] + ',' +
                    color[1] + ',' +
                    color[2] + ',' +
                    color[3] + ')';
                $highlight.append('<div class="heatmap-pixel" ' +
                    'style="' +
                    'height:' + pixelSize + 'px;' +
                    'width:' + pixelSize + 'px;' +
                    'left:' + left + 'px;' +
                    'top:' + top + 'px;' +
                    'background-color:' + rgba + ';"></div>');
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
            _.forIn(data, function(bins, id) {
                trails[id] = trails[id] || [];
                // THIS CAN ADD DUPSSS if the data already exists in cache
                bins.forEach( function( bin ) {
                    // add id under the pixel at RENDER resolution
                    var downRes = resolution / DOWN_SAMPLE;
                    var rx = (coord.x * downRes) + Math.floor(bin[0] / DOWN_SAMPLE);
                    var ry = (coord.y * downRes) + Math.floor(bin[1] / DOWN_SAMPLE);
                    pixels[rx] = pixels[rx] || {};
                    pixels[rx][ry] = pixels[rx][ry] || {};
                    //if ( !pixels[rx][ry][id] ) {
                        pixels[rx][ry][id] = true;
                        var x = (coord.x * TILE_SIZE) + (bin[0] * pixelSize);
                        var y = (coord.y * TILE_SIZE) + (bin[1] * pixelSize);
                        // add pixel under the trail at NATIVE resolution
                        trails[id].push([ x, y ]);
                    //}
                });
            });
            $( container ).css('pointer-events', 'all');
        }

    });

    module.exports = TopTrails;

}());
