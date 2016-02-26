(function() {

    'use strict';

    var $ = require('jquery');
    var ImageLayer = require('./Image');

    var Pending = ImageLayer.extend({

        initialize: function() {
            this._pendingTiles = {};
            L.setOptions(this, {
                unloadInvisibleTiles: true,
                zIndex: 5000
            });
        },

        increment: function(coord) {
            var hash = this._getTileHash(coord);
            if (this._pendingTiles[hash] === undefined) {
                this._pendingTiles[hash] = 1;
                var tiles = this._getTilesWithHash(hash);
                tiles.forEach(function(tile) {
                    this._redrawTile(tile);
                }, this);
            } else {
                this._pendingTiles[hash]++;
            }
        },

        decrement: function(coord) {
            var hash = this._getTileHash(coord);
            this._pendingTiles[hash]--;
            if (this._pendingTiles[hash] === 0) {
                delete this._pendingTiles[hash];
                var tiles = this._getTilesWithHash(hash);
                tiles.forEach(function(tile) {
                    this._redrawTile(tile);
                }, this);
            }
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

        _getTileClass: function(hash) {
            return 'pending-' + hash;
        },

        _getTileHash: function(coord) {
            return coord.z + '-' + coord.x + '-' + coord.y;
        },

        _getTilesWithHash: function(hash) {
            var className = this._getTileClass(hash);
            var tiles = [];
            $(this._container).find('.' + className).each(function() {
                tiles.push(this);
            });
            return tiles;
        },

        _redrawTile: function(tile) {
            var coord = {
                x: tile._tilePoint.x,
                y: tile._tilePoint.y,
                z: this._map._zoom
            };
            var hash = this._getTileHash(coord);
            $(tile).addClass(this._getTileClass(hash));
            if (this._pendingTiles[hash] > 0) {
                this.renderTile(tile, coord);
            } else {
                tile.innerHTML = '';
            }
            this.tileDrawn(tile);
        },

        _createTile: function() {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-pending-tile');
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

        renderTile: function( /*elem*/ ) {
            // override
        },

        tileDrawn: function(tile) {
            this._tileOnLoad.call(tile);
        }

    });

    module.exports = Pending;

}());
