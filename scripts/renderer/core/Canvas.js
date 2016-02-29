(function() {

    'use strict';

    var DOM = require('./DOM');

    var Canvas = DOM.extend({

        initialize: function(meta, options) {
            DOM.prototype.initialize.apply(this, arguments);
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
