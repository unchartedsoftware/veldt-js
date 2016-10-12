(function() {

    'use strict';

    const HTML = require('../../core/HTML');
    const ValueTransform = require('../../mixin/ValueTransform');

    const Heatmap = HTML.extend({

        includes: [
            // mixins
            ValueTransform
        ],

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
        },

        onClick: function(e) {
            const target = $(e.originalEvent.target);
            $('.heatmap-ring').removeClass('highlight');
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            if (target.hasClass('heatmap-ring')) {
                target.addClass('highlight');
            }
        },

        renderTile: function(container, data) {
            if (!data) {
                return;
            }
            const bins = new Float64Array(data);
            const resolution = Math.sqrt(bins.length);
            const binSize = (this.options.tileSize / resolution);
            let html = '';
            bins.forEach((bin, index) => {
                if (!bin) {
                    return;
                }
                const percent = this.transformValue(bin);
                const radius = percent * binSize;
                const offset = (binSize - radius) / 2;
                const left = (index % resolution) * binSize;
                const top = Math.floor(index / resolution) * binSize;
                html +=
                    `
                    <div class="heatmap-ring" style="
                        left: ${left + offset}px;
                        top: ${top + offset}px;
                        width: ${radius}px;
                        height: ${radius}px;">
                    </div>
                    `;
            });
            container.innerHTML = html;
        }

    });

    module.exports = Heatmap;

}());
