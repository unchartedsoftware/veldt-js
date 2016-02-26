(function() {

    'use strict';

    var $ = require('jquery');
    var Debug = require('../core/Debug');

    var TileCoord = Debug.extend({

        renderTile: function(elem, coord) {
            $(elem).empty();
            $(elem).append('<div style="top:0; left:0;">' + coord.z + ', ' + coord.x + ', ' + coord.y + '</div>');
        }

    });

    module.exports = TileCoord;

}());
