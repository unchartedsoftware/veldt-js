(function() {

    'use strict';

    var $ = require('jquery');
    var LiveTileLayer = require('./LiveTileLayer');

    var HTML = LiveTileLayer.extend({

        initialize: function(meta, options) {
            LiveTileLayer.prototype.initialize.apply(this, arguments);
            if (!options.rendererClass) {
                console.warn('No `rendererClass` option found, this layer will not render any data.');
            } else {
                // recursively extend
                $.extend(true, this, options.rendererClass);
            }
            L.setOptions(this, options);
        },

        onAdd: function(map) {
            var self = this;
            LiveTileLayer.prototype.onAdd.call(this, map);
            map.on('click', this.onClick, this);
            $(this._container).on('mouseover', function(e) {
                self.onHover(e);
            });
        },

        onRemove: function(map) {
            map.off('click', this.onClick);
            $(this._container).off('mouseover');
            LiveTileLayer.prototype.onRemove.call(this, map);
        },

        _createTile: function() {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-html-tile');
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            tile.onselectstart = L.Util.falseFn;
            tile.onmousemove = L.Util.falseFn;
            return tile;
        },

        onHover: function() {
            // override
        },

        onClick: function() {
            // override
        }

    });

    module.exports = HTML;

}());
