(function() {

    'use strict';

    let TILE_SIZE = 256;

    function fract(f) {
        return f % 1;
    }

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    function getHash(lx, ly, radius) {
        let diameter = radius * 2;
        let xHash = Math.floor(lx / diameter);
        let yHash = Math.floor(ly / diameter);
        return xHash + ':' + yHash;
    }

    function getHashes(lx, ly, radius, zoom) {
        let diameter = radius * 2;
        let numCells = Math.ceil((Math.pow(2, zoom) * TILE_SIZE) / diameter);
        let x = lx / diameter;
        let y = ly / diameter;
        let fx = fract(x);
        let fy = fract(y);
        let px = fx > 0.5;
        let nx = fx < 0.5;
        let py = fy > 0.5;
        let ny = fy < 0.5;
        let cx = Math.floor(x);
        let cy = Math.floor(y);
        let cells = [
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
        // return hashes
        return cells.map(cell => {
            // mod the cell coords if they overflow
            cell[0] = mod(cell[0], numCells);
            cell[1] = mod(cell[1], numCells);
            // hash
            return cell[0] + ':' + cell[1];
        });
    }

    function circleCollision(point, origin, radius, zoom) {
        let dim = Math.pow(2, zoom) * TILE_SIZE;
        let p, o;
        // check cases where the point is near the opposing horizontal extrema
        // of the map and ensure that the distance calculated is the shortest
        if (point.x < radius && dim - origin.x < radius) {
            p = point;
            o = {
                x: origin.x - dim,
                y: origin.y
            };
        } else if (dim - point.x < radius && origin.x < radius) {
            p = {
                x: point.x - dim,
                y: point.y
            };
            o = origin;
        } else {
            p = point;
            o = origin;
        }
        let dx = p.x - o.x;
        let dy = p.y - o.y;
        let distSqr = (dx * dx) + (dy * dy);
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

    function addPoint(point, radius, zoom) {
        // spatial hash key
        let x = point.x;
        let y = point.y;
        let hashes = getHashes(x, y, radius, zoom);
        // add pixel to hash
        let i;
        for (i=0; i<hashes.length; i++) {
            let hash = hashes[i];
            this._spatialHash[hash] = this._spatialHash[hash] || [];
            this._spatialHash[hash].push(point);
        }
    }

    function removePoint(point, radius, zoom) {
        // spatial hash key
        let hashes = getHashes(point.x, point.y, radius, zoom);
        // add pixel to hash
        let i;
        for (i=0; i<hashes.length; i++) {
            let hash = hashes[i];
            let points = this._spatialHash[hash];
            if (points) {
                let index = points.indexOf(point);
                if (index >= 0) {
                    points.splice(index, 1);
                }
            }
        }
    }

    function pick(point, radius, zoom) {
        let hash = getHash(point.x, point.y, radius);
        // get points in bin
        let points = this._spatialHash[hash];
        if (points) {
            // find first intersecting point in the bin
            let p, i;
            for (i=0; i<points.length; i++) {
                p = points[i];
                // check for collision
                if (circleCollision(point, p, radius, zoom)) {
                    // return first point
                    return p;
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
