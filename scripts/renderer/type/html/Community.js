(function() {

    'use strict';

    let HTML = require('../../core/HTML');

    let Community = HTML.extend({

        _getBinCoordFromCartesian: function(px, py, zoom) {
            // Coords are named lon/lat, but are actually in the range [0, 255].
            // The Leaflet map is setup to use a custom projection to reflect this on
            // creation.
            let layerPt = this._getLayerPointFromLonLat({
                'lon': px,
                'lat': py
            }, zoom);
            let res =  this.getBinCoordFromLayerPoint(layerPt, 256);
            return res;
        },

        // render community rings
        renderTile: function(container, data, coord) {
            if (!data) {
                return;
            }
            let dataView = new DataView(data);
            let decoder = new TextDecoder('utf-8');
            let decodedString = decoder.decode(dataView);
            let jsonObj = JSON.parse(decodedString);

            let divs = $();
            _.forEach(jsonObj.communities, community => {
                if (community.numNodes > 1) {
                    let div = this._createRingDiv(
                        community.radius,
                        community.coords,
                        coord.z,
                        'community-ring');
                    div.data('communityData', community);
                    divs = divs.add(div);
                }
            });
            $(container).append(divs);
        },

        // forward community metadata string to app level mousemove handler when pointer is
        // over a community ring
        onMouseOver: function(e) {
            let target = $(e.originalEvent.target);
            let data = target.data('communityData');
            let value = {name: data.metadata, count: data.numNodes};
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

        _createRingDiv: function(communityRadius, communityCoords, zoomLevel, className) {
            let radius = Math.max(4, communityRadius * Math.pow(2, zoomLevel));
            let offset = radius;
            let binCoord = this._getBinCoordFromCartesian(
                communityCoords[0],
                communityCoords[1],
                zoomLevel);
            let left = binCoord.x;
            let top = binCoord.y;

            return $(
                `
                <div class="${className}" style="
                    left: ${left - offset}px;
                    top: ${top - offset}px;
                    width: ${radius * 2}px;
                    height: ${radius * 2}px;">
                </div>
                `);
        }
    });

    module.exports = Community;

}());
