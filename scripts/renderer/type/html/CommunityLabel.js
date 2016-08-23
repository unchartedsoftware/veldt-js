(function() {

    'use strict';

    var HTML = require('../../core/HTML');

    var CommunityLabel = HTML.extend({

        options: {
            labelScale: 1.0,
            labelMaxLength: 200,
            labelThreshold: [
                [0, 5000],
                [10, 100],
                [14, 10],
                [16, 0]
            ]
        },

        initialize: function() {
            // expand thresholds for lookups during rendering
            this.labelThreshold = [];
            if (this.options.labelThreshold.length === 1) {
                this.labelThreshold = this.options.labelThreshold;
            } else {
                var that = this;
                _.forEach(_.dropRight(this.options.labelThreshold, 1), function(v, i) {
                    var next = that.options.labelThreshold[i + 1];
                    var step = next[0] - v[0];
                    that.labelThreshold = that.labelThreshold.concat(
                        _.zip(_.range(v[0], next[0]), _.fill(Array(step), v[1])));
                });
                that.labelThreshold.push(_.last(this.options.labelThreshold));
            }
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
                var idx = _.clamp(coord.z, 0, that.labelThreshold.length - 1);
                if (community.numNodes > that.labelThreshold[idx][1]) {
                    var div = that._createLabelDiv(
                        community.coords, community.radius, coord.z,
                        community.metadata, 'community-label');
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

        _createLabelDiv: function(communityCoords, communityRadius, zoomLevel, label, className) {
            var radius = Math.max(16, communityRadius * Math.pow(2, zoomLevel));
            var binCoord = this._getBinCoordFromCartesian(
                communityCoords[0],
                communityCoords[1],
                zoomLevel);
            var left = binCoord.x - this.options.labelMaxLength / 2;
            var top = binCoord.y - (radius / 2);

            return $(
                '<div class="' + className + ' ' + radius + '" style="' +
                'left:' + left + 'px;' +
                'top:' + top + 'px;' +
                'line-height:' + radius + 'px;' +
                '">' + label + '</div>');
        }
    });

    module.exports = CommunityLabel;

}());
