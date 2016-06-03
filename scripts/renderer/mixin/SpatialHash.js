(function() {

    'use strict';

    var TILE_SIZE = 256;

    function fract(f) {
        return f % 1;
    }

    function getHash(lx, ly, radius) {
        var diameter = radius * 2;
        var xHash = Math.floor(lx / diameter);
        var yHash = Math.floor(ly / diameter);
        return xHash + ':' + yHash;
    }

    function getHashes(lx, ly, radius, zoom) {
        var diameter = radius * 2;
        var numCells = Math.pow(2, zoom) * TILE_SIZE;
        var x = lx / diameter;
        var y = ly / diameter;
        var fx = fract(x);
        var fy = fract(y);
        var px = fx > 0.5;
        var nx = fx < 0.5;
        var py = fy > 0.5;
        var ny = fy < 0.5;
        var cx = Math.floor(x);
        var cy = Math.floor(y);
        var cells = [
            [cx, cy]
        ];
        if (px) {
            cells.push([cx+1, cy]);
        }
        if (py) {
            cells.push([cx, cy+1]);
        }
        if (nx) {
            cells.push([cx-1, cy]);
        }
        if (ny) {
            cells.push([cx, cy-1]);
        }
        if (nx && ny) {
            cells.push([cx-1, cy-1]);
        }
        if (px && py) {
            cells.push([cx+1, cy+1]);
        }
        if (nx && py) {
            cells.push([cx-1, cy+1]);
        }
        if (px && ny) {
            cells.push([cx+1, cy-1]);
        }
        return cells.filter(function(cell) {
            // remove cells outside tile (shouldn't occur?)
            var x = cell[0];
            var y = cell[1];
            return x >= 0 && x < numCells && y >= 0 && y < numCells;
        }).map(function(cell) {
            // hash
            return cell[0] + ':' + cell[1];
        });
    }

    function circleCollision(btx, bty, origin, radius) {
        var dx = btx - (origin.x + radius);
        var dy = bty - (origin.y + radius);
        var distSqr = (dx * dx) + (dy * dy);
        if (distSqr < (radius * radius)) {
            return true;
        }
        return false;
    }

    function initialize() {
        this.clearHash();
    }

    function clearHash() {
        this._spatialHash = {};
    }

    function addPoint(point, radius) {
        // spatial hash key
        var x = point.x;
        var y = point.y;
        var hashes = getHashes(x, y, radius);
        // add pixel to hash
        var i;
        for (i=0; i<hashes.length; i++) {
            var hash = hashes[i];
            this._spatialHash[hash] = this._spatialHash[hash] || [];
            this._spatialHash[hash].push(point);
        }
    }

    function removePoint(point, radius) {
        // spatial hash key
        var hashes = getHashes(point.x, point.y, radius);
        // add pixel to hash
        var i;
        for (i=0; i<hashes.length; i++) {
            var hash = hashes[i];
            var points = this._spatialHash[hash];
            if (points) {
                var index = points.indexOf(point);
                if (index > 0) {
                    points.splice(index, 1);
                }
            }
        }
    }

    function pick(x, y, radius) {
        var hash = getHash(x, y, radius);
        // get points in bin
        var points = this._spatialHash[hash];
        if (points) {
            // find first intersecting point in the bin
            var point, i;
            for (i=0; i<points.length; i++) {
                point = points[i];
                // check for collision
                if (circleCollision(x, y, point, radius)) {
                    // return first point
                    return point;
                }
            }
        }
    }

    module.exports = {
        initialize: initialize,
        clearHash: clearHash,
        addPoint: addPoint,
        removePoint: removePoint,
        pick: pick
    };

}());
