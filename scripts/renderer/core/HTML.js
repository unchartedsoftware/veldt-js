(function() {

    'use strict';

    var DOM = require('./DOM');

    var HTML = DOM.extend({

        options: {
            handlers: {}
        },

        createTile: function() {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-html-tile');
            return tile;
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

    module.exports = HTML;

}());
