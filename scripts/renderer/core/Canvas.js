(function() {

    'use strict';

    var DOM = require('./DOM');

    var Canvas = DOM.extend({

        options: {
            handlers: {}
        },

        createTile: function() {
            var tile = L.DomUtil.create('canvas', 'leaflet-tile');
            tile.style['pointer-events'] = 'all';
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            return tile;
        },

        clearTiles: function() {
            var tileSize = this.options.tileSize;
            _.forIn(this._tiles, function(tile) {
                var ctx = tile.el.getContext('2d');
                ctx.clearRect(0, 0, tileSize, tileSize);
            });
        },

        onMouseMove: function() {
            // override
        },

        onMouseOver: function() {
            // override
        },

        onMouseOut: function() {
            // override
        },

        onClick: function() {
            // override
        }

    });

    module.exports = Canvas;

}());
