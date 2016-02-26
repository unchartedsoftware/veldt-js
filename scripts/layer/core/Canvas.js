(function() {

    'use strict';

    var LiveTileLayer = require('./LiveTileLayer');

    var Canvas = LiveTileLayer.extend({

        _createTile: function() {
            var tile = L.DomUtil.create('canvas', 'leaflet-tile');
            tile.width = tile.height = this.options.tileSize;
            tile.onselectstart = tile.onmousemove = L.Util.falseFn;
            return tile;
        }

    });

    module.exports = Canvas;

}());
