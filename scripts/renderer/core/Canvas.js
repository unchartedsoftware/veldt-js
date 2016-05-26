(function() {

    'use strict';

    var DOM = require('./DOM');

    var Canvas = DOM.extend({

        options: {
            handlers: {}
        },

        onAdd: function(map) {
            DOM.prototype.onAdd.call(this, map);
            // handlers
            var self = this;
            map.on('click', this.onClick, this);
            $(this._container).on('mousemove', function(e) {
                $(map._container).css('cursor', '');
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

        createTile: function() {
            var tile = L.DomUtil.create('canvas', 'leaflet-tile');
            tile.style['pointer-events'] = 'all';
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            return tile;
        },

        clearTiles: function() {
            var tileSize = this.options.tileSize;
            _.forIn(this._tiles, function(tile) {
                var ctx = tile.el.getContext('2d');
                ctx.clearRect(0, 0, tileSize, tileSize);
            });
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

    module.exports = Canvas;

}());
