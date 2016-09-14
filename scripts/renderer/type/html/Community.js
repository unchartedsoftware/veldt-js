(function() {

    'use strict';

    let HTML = require('../../core/HTML');
    let TILE_SIZE = 256;

    let Community = HTML.extend({

        // forward community metadata string to app level mousemove handler when pointer is
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
                type: 'community',
                layer: this
            });
        },

        // forward cleared string to app level mousemove handler when pointer moves off
        // a community ring
        onMouseOut: function(e) {
            this.fire('mouseout', {
                elem: e.originalEvent.target,
                type: 'community',
                layer: this
            });
        },

        _createRingDiv: function(community, coord, className) {
            let radius = Math.max(4, community.radius * Math.pow(2, coord.z));
            let diameter = radius * 2;
            let left = community.pixel.x % TILE_SIZE;
            let top = community.pixel.y % TILE_SIZE;
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
                if (community.numNodes > 1) {
                    let div = this._createRingDiv(
                        community,
                        coord,
                        'community-ring');
                    div.data('name', community.metadata);
                    div.data('count', community.numNodes);
                    divs = divs.add(div);
                }
            });
            $(container).append(divs);
        }

    });

    module.exports = Community;

}());
