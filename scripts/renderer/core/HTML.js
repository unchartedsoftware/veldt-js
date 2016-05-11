(function() {

    'use strict';

    var DOM = require('./DOM');

    var HTML = DOM.extend({

        options: {
            handlers: {}
        },

        onAdd: function(map) {
            var self = this;
            DOM.prototype.onAdd.call(this, map);
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
            map.off('click', this.onClick, this);
            $(this._container).off('mousemove');
            $(this._container).off('mouseover');
            $(this._container).off('mouseout');
            DOM.prototype.onRemove.call(this, map);
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
