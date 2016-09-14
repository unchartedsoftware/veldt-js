(function() {

    'use strict';

    let HTML = require('../../core/HTML');
    let ValueTransform = require('../../mixin/ValueTransform');
    let TILE_SIZE = 256;

    let CommunityLabel = HTML.extend({

        includes: [
            // mixins
            ValueTransform
        ],

        options: {
            minFontSize: 10,
            maxFontSize: 14,
            labelMaxLength: TILE_SIZE,
            labelThreshold: 0.8
        },

        // forward community title string to app level mousemove handler when pointer is
        // over a community ring
        onMouseOver: function(e) {
            let target = $(e.originalEvent.target);
            let value = {name: target.data('name'), count: target.data('count')};
            if (!value) {
                value = {};
            }
            this.fire('mouseover', {
                elem: e.originalEvent.target,
                value: value,
                type: 'community-labels',
                layer: this
            });
        },

        // forward cleared string to app level mousemove handler when pointer moves off
        // a community ring
        onMouseOut: function(e) {
            this.fire('mouseout', {
                elem: e.originalEvent.target,
                type: 'community-labels',
                layer: this
            });
        },

        _createLabelDiv: function(community, coord, className) {
            let radius = Math.max(16, community.radius * Math.pow(2, coord.z));
            let left = (community.pixel.x % TILE_SIZE) - (this.options.labelMaxLength / 2);
            let top = (community.pixel.y % TILE_SIZE) + (radius / 2);
            let nval = this.transformValue(community.numNodes);
            let fontSize = this.options.minFontSize + nval * (this.options.maxFontSize - this.options.minFontSize);
            return $(
                `
                <div class="${className} ${radius}" style="
                    left: ${left}px;
                    top: ${top}px;
                    font-size: ${fontSize}px;
                    line-height: ${fontSize}px;">${community.title}</div>
                `);
        },

        renderTile: function(container, data, coord) {
            if (!data) {
                return;
            }
            let divs = $();
            data.forEach(community => {
                if (community.title === '') {
                    return;
                }
                const nval = this.transformValue(community.numNodes);
                if (nval < this.options.labelThreshold) {
                    return;
                }
                let div = this._createLabelDiv(community, coord, 'community-label');
                div.data('name', community.title);
                div.data('count', community.numNodes);
                divs = divs.add(div);
            });
            $(container).append(divs);
        }

    });

    module.exports = CommunityLabel;

}());
