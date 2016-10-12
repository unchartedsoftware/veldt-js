(function() {

    'use strict';

    const HTML = require('../../core/HTML');
    const ValueTransform = require('../../mixin/ValueTransform');
    const TILE_SIZE = 256;

    const CommunityLabel = HTML.extend({

        includes: [
            // mixins
            ValueTransform
        ],

        options: {
            minFontSize: 10,
            maxFontSize: 24,
            minOpacity: 0.5,
            maxOpacity: 1.0,
            labelMaxLength: TILE_SIZE,
            labelThreshold: 0.6,
            labelField: 'metadata'
        },

        onMouseOver: function(e) {
            // forward community title string to app level mousemove handler
            // when pointer is over a community ring
            const target = $(e.originalEvent.target);
            const data = target.data('communityData');
            const value = {
                name: data.metadata,
                count: data.numNodes
            };
            this.fire('mouseover', {
                elem: e.originalEvent.target,
                value: value,
                type: 'community-labels',
                layer: this
            });
        },

        onMouseOut: function(e) {
            // forward cleared string to app level mousemove handler when
            // pointer moves off a community ring
            this.fire('mouseout', {
                elem: e.originalEvent.target,
                type: 'community-labels',
                layer: this
            });
        },

        _createLabelDiv: function(community, coord, className) {
            let nval = this.transformValue(_.get(community, this.options.degreeField));
            // normalize the nval as it is currently in the range [this.options.labelThreshold : 1]
            nval = (nval - this.options.labelThreshold) / (1.0 - this.options.labelThreshold);
            const zIndex = Math.ceil(100 * nval);
            const fontSize = this.options.minFontSize + (nval * (this.options.maxFontSize - this.options.minFontSize));
            const opacity = this.options.minOpacity + (nval * (this.options.maxOpacity - this.options.minOpacity));
            const dim = Math.pow(2, coord.z);
            const tileSpan = Math.pow(2, 32) / dim;
            const x = _.get(community, this.getXField());
            const y = _.get(community, this.getYField());
            const left = ((x % tileSpan) / tileSpan) * TILE_SIZE - (this.options.labelMaxLength / 2);
            const top = ((y % tileSpan) / tileSpan) * TILE_SIZE - (fontSize / 2);
            return $(
                `
                <div class="${className}" style="
                    left: ${left}px;
                    top: ${top}px;
                    opacity: ${opacity};
                    font-size: ${fontSize}px;
                    z-index: ${zIndex};
                    line-height: ${fontSize}px;">${_.get(community, this.options.labelField)}</div>
                `);
        },

        renderTile: function(container, data, coord) {
            if (!data) {
                return;
            }
            let divs = $();
            data.forEach(community => {
                if (!_.get(community, this.options.labelField)) {
                    return;
                }
                const nval = this.transformValue(_.get(community, this.options.degreeField));
                if (nval < this.options.labelThreshold) {
                    return;
                }
                const div = this._createLabelDiv(community, coord, 'community-label');
                div.data('communityData', community);
                divs = divs.add(div);
            });
            $(container).empty().append(divs);
        }

    });

    module.exports = CommunityLabel;

}());
