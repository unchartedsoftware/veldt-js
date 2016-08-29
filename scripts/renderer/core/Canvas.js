(function() {

    'use strict';

    let DOM = require('./DOM');

    let Canvas = DOM.extend({

        onAdd: function(map) {
            DOM.prototype.onAdd.call(this, map);
            // handlers
            map.on('click', this.onClick, this);
            map.on('mousemove', this.onMouseMove, this);
        },

        onRemove: function(map) {
            // handlers
            map.off('click', this.onClick, this);
            map.off('mousemove', this.onMouseMove, this);
            DOM.prototype.onRemove.call(this, map);
        },

        createTile: function(coords, done) {
            let tile = L.DomUtil.create('canvas', 'leaflet-tile');
            tile.style['pointer-events'] = 'all';
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            this._requestTile(coords, tile, () => {
                done(null, tile);
            });
            return tile;
        },

        clearTiles: function() {
            let tileSize = this.options.tileSize;
            _.forIn(this._tiles, tile => {
                let ctx = tile.el.getContext('2d');
                ctx.clearRect(0, 0, tileSize, tileSize);
            });
        },

        onMouseMove: function() {
            // override
        },

        onClick: function() {
            // override
        }

    });

    module.exports = Canvas;

}());
