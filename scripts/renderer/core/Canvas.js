(function() {

    'use strict';

    var DOM = require('./DOM');

    var Canvas = DOM.extend({
        options: {
            handlers: {}
        },

        onAdd: function(map) {
            DOM.prototype.onAdd.call(this, map);
            map.on('click', this.onClick, this);
        },

        onRemove: function(map) {
            map.off('click', this.onClick, this);
        },

        _createTile: function() {
            var tile = L.DomUtil.create('canvas', 'leaflet-tile');
            tile.width = tile.height = this.options.tileSize;
            tile.onselectstart = tile.onmousemove = L.Util.falseFn;
            return tile;
        },

        onClick: function() {
            // override
        }
    });

    module.exports = Canvas;

}());
