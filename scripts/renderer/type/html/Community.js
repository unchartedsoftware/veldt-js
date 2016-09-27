(function() {

    'use strict';

    let HTML = require('../../core/HTML');
    let ValueTransform = require('../../mixin/ValueTransform');
    let TILE_SIZE = 256;

    let Community = HTML.extend({

        includes: [
            // mixins
            ValueTransform
        ],

        options: {
            communityThreshold: 0.5,
            padding: 0,
            radiusField: 'node.radius',
            degreeField: 'nopde.properties.degree'
        },

        onMouseOver: function(e) {
            // forward community metadata string to app level mousemove handler
            // when pointer is over a community ring
            let target = $(e.originalEvent.target);
            let data = target.data('communityData');
            let value = {name: data.properties.metadata, count: data.properties.numNodes};
            if (!value) {
                value = {};
            }
            this.fire('mouseover', {
                elem: e.originalEvent.target,
                value: value,
                type: 'community',
                layer: this
            });
        },

        onMouseOut: function(e) {
            // forward cleared string to app level mousemove handler when
            // pointer moves off a community ring
            this.fire('mouseout', {
                elem: e.originalEvent.target,
                type: 'community',
                layer: this
            });
        },

        // forward click event to app level click handler
        onClick: function(e) {
            let data = $(e.originalEvent.target).data('communityData');
            this.fire('click', {
                elem: e.originalEvent.target,
                value: data,
                type: 'community',
                layer: this
            });
        },

        _createRingDiv: function(community, coord, className) {
            let radius = this.options.padding + Math.max(4, community[this.options.radiusfield] * Math.pow(2, coord.z));
            let diameter = radius * 2;
            let dim = Math.pow(2, coord.z);
            let tileSpan = Math.pow(2, 32) / dim;
            let left = (community[this.getXField()] % tileSpan) / tileSpan * TILE_SIZE;
            let top = (community[this.getYField()] % tileSpan) / tileSpan * TILE_SIZE;
            return $(
                `
                <div class="${className}" style="
                    left: ${left - radius}px;
                    top: ${top - radius}px;
                    width: ${diameter}px;
                    height: ${diameter}px;">
                </div>
                `);
        },

        renderTile: function(container, data, coord) {
            if (!data) {
                return;
            }
            let divs = $();
            data.forEach(community => {
                const nval = this.transformValue(community[this.options.degreeField]);
                if (nval < this.options.communityThreshold) {
                    return;
                }
                let div = this._createRingDiv(
                    community,
                    coord,
                    'community-ring');
                div.data('communityData', community);
                divs = divs.add(div);
            });
            $(container).empty().append(divs);
        }

    });

    module.exports = Community;

}());
