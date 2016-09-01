(function() {

    'use strict';

    let HTML = require('../../core/HTML');
    let ValueTransform = require('../../mixin/ValueTransform');

    let Heatmap = HTML.extend({

        includes: [
            // mixins
            ValueTransform
        ],

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
        },

        onClick: function(e) {
            let target = $(e.originalEvent.target);
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
            let bins = new Float64Array(data);
            let resolution = Math.sqrt(bins.length);
            let binSize = (this.options.tileSize / resolution);
            let html = '';
            bins.forEach((bin, index) => {
                if (!bin) {
                    return;
                }
                let percent = this.transformValue(bin);
                let radius = percent * binSize;
                let offset = (binSize - radius) / 2;
                let left = (index % resolution) * binSize;
                let top = Math.floor(index / resolution) * binSize;
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
