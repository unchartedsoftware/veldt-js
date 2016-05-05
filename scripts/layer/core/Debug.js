(function() {

    'use strict';

    var Tile = require('./Tile');

    var Debug = Tile.extend({

        options: {
            unloadInvisibleTiles: true,
            zIndex: 5000
        },

        initialize: function(options) {
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

        createTile: function(coord) {
            // create a <div> element for drawing
            var tile = L.DomUtil.create('div', 'leaflet-tile');
            // draw to it
            this.renderTile(tile, coord);
            // pass tile to callback
            return tile;
        },

        renderTile: function() {
            // override
        }

    });

    module.exports = Debug;

}());
