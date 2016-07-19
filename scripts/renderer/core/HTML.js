(function() {

    'use strict';

    var DOM = require('./DOM');

    var HTML = DOM.extend({

        onAdd: function(map) {
            DOM.prototype.onAdd.call(this, map);
            // handlers
            var self = this;
            map.on('click', this.onClick, this);
            $(this._container).on('mousemove', function(e) {
                self.onMouseMove(e);
            });
            $(this._container).on('mouseover', function(e) {
                self.onMouseOver(e);
            });
            $(this._container).on('mouseout', function(e) {
                self.onMouseOut(e);
            });
        },

        onRemove: function(map) {
            // handlers
            map.off('click', this.onClick, this);
            $(this._container).off('mousemove');
            $(this._container).off('mouseover');
            $(this._container).off('mouseout');
            DOM.prototype.onRemove.call(this, map);
        },

        createTile: function(coords, done) {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-html-tile');
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            this._requestTile(coords, tile, function() {
                done(null, tile);
            });
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
