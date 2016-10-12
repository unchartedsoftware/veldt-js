(function() {

    'use strict';

    const HTML = require('../../core/HTML');
    const ColorRamp = require('../../mixin/ColorRamp');
    const ValueTransform = require('../../mixin/ValueTransform');

    const Heatmap = HTML.extend({

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
            const target = $(e.originalEvent.target);
            const value = target.attr('data-value');
            if (value) {
                // get layer coord
                const layerPoint = this.getLayerPointFromEvent(e.originalEvent);
                // get tile coord
                const coord = this.getTileCoordFromLayerPoint(layerPoint);
                this.fire('mouseover', {
                    elem: e.originalEvent.target,
                    value: parseInt(value, 10),
                    x: coord.x,
                    y: coord.y,
                    z: coord.z,
                    bx: parseInt(target.attr('data-bx'), 10),
                    by: parseInt(target.attr('data-by'), 10),
                    type: 'heatmap',
                    layer: this
                });
            }
        },

        onMouseOut: function(e) {
            const target = $(e.originalEvent.target);
            const value = target.attr('data-value');
            if (value) {
                // get layer coord
                const layerPoint = this.getLayerPointFromEvent(e.originalEvent);
                // get tile coord
                const coord = this.getTileCoordFromLayerPoint(layerPoint);
                this.fire('mouseout', {
                    elem: e.originalEvent.target,
                    value: parseInt(value, 10),
                    x: coord.x,
                    y: coord.y,
                    z: coord.z,
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
            const target = $(e.originalEvent.target);
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            if (target.hasClass('heatmap-pixel')) {
                target.addClass('highlight');
            }
            const value = target.attr('data-value');
            if (value) {
                // get layer coord
                const layerPoint = this.getLayerPointFromEvent(e.originalEvent);
                // get tile coord
                const coord = this.getTileCoordFromLayerPoint(layerPoint);
                this.fire('click', {
                    elem: e.originalEvent.target,
                    value: parseInt(value, 10),
                    x: coord.x,
                    y: coord.y,
                    z: coord.z,
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
            const bins = new Float64Array(data);
            const resolution = Math.sqrt(bins.length);
            const ramp = this.getColorRamp();
            const pixelSize = this.options.tileSize / resolution;
            const color = [0, 0, 0, 0];
            let html = '';
            let nval = 0;
            let rval = 0;
            let left = 0;
            let top = 0;
            for (let i=0; i<bins.length; i++) {
                const bin = bins[i];
                if (bin === 0) {
                    continue;
                } else {
                    left = (i % resolution);
                    top = Math.floor(i / resolution);
                    nval = this.transformValue(bin);
                    rval = this.interpolateToRange(nval);
                    ramp(rval, color);
                }
                const r = Math.round(color[0] * 255);
                const g = Math.round(color[1] * 255);
                const b = Math.round(color[2] * 255);
                const a = color[3];
                const rgba = `rgba(${r}, ${g}, ${b}, ${a})`;
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
