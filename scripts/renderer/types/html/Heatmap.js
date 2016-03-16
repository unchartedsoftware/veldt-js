(function() {

    'use strict';

    var HTML = require('../../core/HTML');

    var TILE_SIZE = 256;

    var Heatmap = HTML.extend({

        isTargetLayer: function( elem ) {
            return this._container && $.contains(this._container, elem );
        },

        clearSelection: function() {
            $(this._container).removeClass('highlight');
            this.highlight = null;
        },

        onClick: function(e) {
            var target = $(e.originalEvent.target);
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            $('.heatmap-pixel').removeClass('highlight');
            if ( target.hasClass('heatmap-pixel') ) {
                target.addClass('highlight');
            }
            if (this.options.handlers.click) {
                var $parent = target.parents('.leaflet-html-tile');
                var value = target.attr('data-value');
                this.options.handlers.click(target, {
                    value: value,
                    x: parseInt($parent.attr('data-x'), 10),
                    y: parseInt($parent.attr('data-y'), 10),
                    z: this._map.getZoom(),
                    type: 'heatmap'
                });
            }
        },

        renderTile: function(container, data) {
            if (!data) {
                return;
            }
            var bins = new Float64Array(data);
            var resolution = Math.sqrt(bins.length);
            var rampFunc = this.getColorRamp();
            var pixelSize = TILE_SIZE / resolution;
            var self = this;
            var color = [0, 0, 0, 0];
            var html = '';
            bins.forEach(function(bin, index) {
                var val, left, top;
                if (bin === 0) {
                    return;
                } else {
                    left = (index % resolution);
                    top = Math.floor(index / resolution);
                    val = self.transformValue(bin);
                    rampFunc(val, color);
                }
                var rgba = 'rgba(' +
                    color[0] + ',' +
                    color[1] + ',' +
                    color[2] + ',' +
                    (color[3] / 255) + ')';
                html += '<div class="heatmap-pixel" style="' +
                    'data-value="' + bin + '"' +
                    'height:' + pixelSize + 'px;' +
                    'width:' + pixelSize + 'px;' +
                    'left:' + (left * pixelSize) + 'px;' +
                    'top:' + (top * pixelSize) + 'px;' +
                    'background-color:' + rgba + ';"></div>';
            });
            container.innerHTML = html;
        }

    });

    module.exports = Heatmap;

}());
