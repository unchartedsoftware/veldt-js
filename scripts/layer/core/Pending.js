(function() {

    'use strict';

    var Base = require('./Base');

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    var Pending = Base.extend({

        options: {
            unloadInvisibleTiles: true,
            zIndex: 5000
        },

        initialize: function(options) {
            this._pendingTiles = {};
            // set renderer
            if (!options.rendererClass) {
                throw 'No `rendererClass` option found.';
            } else {
                // recursively extend
                $.extend(true, this, options.rendererClass);
            }
            // set options
            L.setOptions(this, options);
        },

        increment: function(coord) {
            var hash = this._getTileHash(coord);
            if (this._pendingTiles[hash] === undefined) {
                this._pendingTiles[hash] = 1;
                var tiles = this._getTilesWithHash(hash);
                tiles.forEach(function(tile) {
                    this._updateTile(coord, tile);
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
                    this._updateTile(coord, tile);
                }, this);
            }
        },

        _getTileClass: function(hash) {
            return 'leaflet-pending-' + hash;
        },

        _getNormalizedCoords: function(coords) {
            var pow = Math.pow(2, coords.z);
            return {
                x: mod(coords.x, pow),
                y: mod(coords.y, pow),
                z: coords.z
            };
        },

        _getTileHash: function(coords) {
            var ncoords = this._getNormalizedCoords(coords);
            return ncoords.z + '-' + ncoords.x + '-' + ncoords.y;
        },

        _getTilesWithHash: function(hash) {
            var className = this._getTileClass(hash);
            var tiles = [];
            $(this._container).find('.' + className).each(function() {
                tiles.push(this);
            });
            return tiles;
        },

        _updateTile: function(coord, tile) {
            // get hash
            var hash = this._getTileHash(coord);
            $(tile).addClass(this._getTileClass(hash) + ' pending');
            if (this._pendingTiles[hash] > 0) {
                this.renderTile(tile, coord);
            } else {
                $(tile).removeClass('pending');
                tile.innerHTML = '';
            }
        },

        createTile: function(coord) {
            // create a <div> element for drawing
            var tile = L.DomUtil.create('div', 'leaflet-tile');
            // get hash
            this._updateTile(coord, tile);
            // pass tile to callback
            return tile;
        },

        renderTile: function() {
            // override
        }

    });

    module.exports = Pending;

}());
