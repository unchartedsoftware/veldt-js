(function() {

    'use strict';

    var HTML = require('../../core/HTML');

    var Community = HTML.extend({

        _getBinCoordFromCartesian: function(px, py, zoom) {
            // Coords are named lon/lat, but are actually in the range [0, 255].
            // The Leaflet map is setup to use a custom projection to reflect this on
            // creation.
            var layerPt = this._getLayerPointFromLonLat({
                'lon': px,
                'lat': py
            }, zoom);
            var res =  this.getBinCoordFromLayerPoint(layerPt, 256);
            return res;
        },

        // render community rings
        renderTile: function(container, data, coord) {
            if (!data) {
                return;
            }
            var dataView = new DataView(data);
            var decoder = new TextDecoder('utf-8');
            var decodedString = decoder.decode(dataView);
            var jsonObj = JSON.parse(decodedString);

            var that = this;
            var divs = $();
            _.forEach(jsonObj.communities, function(community) {
                if (community.numNodes > 1) {
                    var div = that._createRingDiv(
                        community.radius,
                        community.coords,
                        coord.z,
                        'community-ring');
                    div.data('name', community.metadata);
                    div.data('count', community.numNodes);
                    divs = divs.add(div);
                }
            });
            $(container).append(divs);
        },

        // forward community metadata string to app level mousemove handler when pointer is
        // over a community ring
        onMouseOver: function(e) {
            var target = $(e.originalEvent.target);
            var value = {name: target.data('name'), count: target.data('count')};
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

        _createRingDiv: function(communityRadius, communityCoords, zoomLevel, className) {
            var radius = Math.max(4, communityRadius * Math.pow(2, zoomLevel));
            var offset = radius / 2;
            var binCoord = this._getBinCoordFromCartesian(
                communityCoords[0],
                communityCoords[1], 
                zoomLevel);
            var left = binCoord.x;
            var top = binCoord.y;

            return $(
                '<div class="' + className + '" style="' +
                'left:' + (left - offset) + 'px;' +
                'top:' + (top - offset) + 'px;' +
                'width:' + radius + 'px;' +
                'height:' + radius + 'px;' +
                '"></div>');
        }
    });

    module.exports = Community;

}());
