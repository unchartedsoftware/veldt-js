(function() {

    'use strict';

    let HTML = require('../../core/HTML');

    let CommunityLabel = HTML.extend({

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
                _.forEach(_.dropRight(this.options.labelThreshold, 1), (v, i) => {
                    let next = this.options.labelThreshold[i + 1];
                    let step = next[0] - v[0];
                    this.labelThreshold = this.labelThreshold.concat(
                        _.zip(_.range(v[0], next[0]), _.fill(Array(step), v[1])));
                });
                this.labelThreshold.push(_.last(this.options.labelThreshold));
            }
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
                let idx = _.clamp(coord.z, 0, this.labelThreshold.length - 1);
                if (community.numNodes > this.labelThreshold[idx][1]) {
                    let div = this._createLabelDiv(
                        community.coords,
                        community.radius,
                        coord.z,
                        community.metadata,
                        'community-label');
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

        _createLabelDiv: function(communityCoords, communityRadius, zoomLevel, label, className) {
            let radius = Math.max(16, communityRadius * Math.pow(2, zoomLevel));
            let binCoord = this._getBinCoordFromCartesian(
                communityCoords[0],
                communityCoords[1],
                zoomLevel);
            let left = binCoord.x - this.options.labelMaxLength / 2;
            let top = binCoord.y - (radius / 2);
            return $(
                `
                <div class="${className} ${radius}" style="
                    left: ${left}px;
                    top: ${top}px;
                    line-height: ${radius}px;">${label}</div>
                `);
        }
    });

    module.exports = CommunityLabel;

}());
