(function() {

    'use strict';

    let HTML = require('../../core/HTML');
    let ColorRamp = require('../../mixin/ColorRamp');
    let ValueTransform = require('../../mixin/ValueTransform');

    let Heatmap = HTML.extend({

        includes: [
            // mixins
            ColorRamp,
            ValueTransform
        ],

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
        },

        onMouseOver: function(e) {
            let target = $(e.originalEvent.target);
            let value = target.attr('data-value');
            if (value) {
                let $parent = target.parents('.leaflet-html-tile');
                this.fire('mouseover', {
                    elem: e.originalEvent.target,
                    value: parseInt(value, 10),
                    x: parseInt($parent.attr('data-x'), 10),
                    y: parseInt($parent.attr('data-y'), 10),
                    z: this._map.getZoom(),
                    bx: parseInt(target.attr('data-bx'), 10),
                    by: parseInt(target.attr('data-by'), 10),
                    type: 'heatmap',
                    layer: this
                });
            }
        },

        onMouseOut: function(e) {
            let target = $(e.originalEvent.target);
            let value = target.attr('data-value');
            if (value) {
                let $parent = target.parents('.leaflet-html-tile');
                this.fire('mouseout', {
                    elem: e.originalEvent.target,
                    value: parseInt(value, 10),
                    x: parseInt($parent.attr('data-x'), 10),
                    y: parseInt($parent.attr('data-y'), 10),
                    z: this._map.getZoom(),
                    bx: parseInt(target.attr('data-bx'), 10),
                    by: parseInt(target.attr('data-by'), 10),
                    type: 'heatmap',
                    layer: this
                });
            }
        },

        onClick: function(e) {
            // un-select any prev selected pixel
            $('.heatmap-pixel').removeClass('highlight');
            // get target
            let target = $(e.originalEvent.target);
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            if (target.hasClass('heatmap-pixel')) {
                target.addClass('highlight');
            }
            let value = target.attr('data-value');
            if (value) {
                let $parent = target.parents('.leaflet-html-tile');
                this.fire('click', {
                    elem: e.originalEvent.target,
                    value: parseInt(value, 10),
                    x: parseInt($parent.attr('data-x'), 10),
                    y: parseInt($parent.attr('data-y'), 10),
                    z: this._map.getZoom(),
                    bx: parseInt(target.attr('data-bx'), 10),
                    by: parseInt(target.attr('data-by'), 10),
                    type: 'heatmap',
                    layer: this
                });
            }
        },

        renderTile: function(container, data) {
            if (!data) {
                return;
            }
            let bins = new Float64Array(data);
            let resolution = Math.sqrt(bins.length);
            let ramp = this.getColorRamp();
            let pixelSize = this.options.tileSize / resolution;
            let color = [0, 0, 0, 0];
            let html = '';
            let nval, rval, bin;
            let left, top;
            let i;
            for (i=0; i<bins.length; i++) {
                bin = bins[i];
                if (bin === 0) {
                    continue;
                } else {
                    left = (i % resolution);
                    top = Math.floor(i / resolution);
                    nval = this.transformValue(bin);
                    rval = this.interpolateToRange(nval);
                    ramp(rval, color);
                }
                let r = Math.round(color[0] * 255);
                let g = Math.round(color[1] * 255);
                let b = Math.round(color[2] * 255);
                let a = color[3];
                let rgba = `rgba(${r}, ${g}, ${b}, ${a})`;
                html += `
                    <div class="heatmap-pixel"
                        data-value="${bin}"
                        data-bx="${left}"
                        data-by="${top}"
                        style="
                            height: ${pixelSize}px;
                            width: ${pixelSize}px;
                            left: ${left * pixelSize}px;
                            top: ${top * pixelSize}px;
                            background-color: ${rgba};">
                    </div>
                    `;
            }
            container.innerHTML = html;
        }

    });

    module.exports = Heatmap;

}());
