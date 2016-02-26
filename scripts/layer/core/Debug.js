(function() {

    'use strict';

    var ImageLayer = require('./Image');

    var Debug = ImageLayer.extend({

        initialize: function() {
            this._pendingTiles = {};
            L.setOptions(this, {
                unloadInvisibleTiles: true,
                zIndex: 5000
            });
        },

        redraw: function() {
            if (this._map) {
                this._reset({
                    hard: true
                });
                this._update();
            }
            return this;
        },

        _redrawTile: function(tile) {
            var coord = {
                x: tile._tilePoint.x,
                y: tile._tilePoint.y,
                z: this._map._zoom
            };
            this.renderTile(tile, coord);
            this.tileDrawn(tile);
        },

        _createTile: function() {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-debug-tile');
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            tile.onselectstart = L.Util.falseFn;
            tile.onmousemove = L.Util.falseFn;
            return tile;
        },

        _loadTile: function(tile, tilePoint) {
            tile._layer = this;
            tile._tilePoint = tilePoint;
            this._adjustTilePoint(tilePoint);
            this._redrawTile(tile);
        },

        renderTile: function( /*elem, coord*/ ) {
            // override
        },

        tileDrawn: function(tile) {
            this._tileOnLoad.call(tile);
        }

    });

    module.exports = Debug;

}());
