(function() {

    'use strict';

    var $ = require('jquery');
    var LiveTileLayer = require('./LiveTileLayer');

    var Canvas = LiveTileLayer.extend({

        initialize: function(meta, options) {
            LiveTileLayer.prototype.initialize.apply(this, arguments);
            if (!options.rendererClass) {
                console.warn('No `rendererClass` option found, this layer will not render any data.');
            } else {
                // recursively extend
                $.extend(true, this, options.rendererClass);
            }
            L.setOptions(this, options);
        },

        _createTile: function() {
            var tile = L.DomUtil.create('canvas', 'leaflet-tile');
            tile.width = tile.height = this.options.tileSize;
            tile.onselectstart = tile.onmousemove = L.Util.falseFn;
            return tile;
        }

    });

    module.exports = Canvas;

}());
