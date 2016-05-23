(function() {

    'use strict';

    var DEFAULT_TILE_SIZE = 256;
    var DEFAULT_X_FIELD = 'pixel.x';
    var DEFAULT_Y_FIELD = 'pixel.y';
    var DEFAULT_PIXEL_MIN = 0;
    var DEFAULT_PIXEL_MAX = Math.pow(2, 32);

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.extrema) {
                return true;
            } else {
                throw 'Field `' + field + '` is not ordinal in meta data.';
            }
        } else {
            throw 'Field `' + field + '` is not recognized in meta data.';
        }
        return false;
    };

    var setXField = function(field) {
        if (field !== this._params.binning.x) {
            if (field === DEFAULT_X_FIELD) {
                // reset if default
                this._params.binning.x = DEFAULT_X_FIELD;
                this._params.binning.left = DEFAULT_PIXEL_MIN;
                this._params.binning.right = DEFAULT_PIXEL_MAX;
                this.clearExtrema();
            } else {
                var meta = this._meta[field];
                if (checkField(meta, field)) {
                    this._params.binning.x = field;
                    this._params.binning.left = meta.extrema.min;
                    this._params.binning.right = meta.extrema.max;
                    this.clearExtrema();
                }
            }
        }
        return this;
    };

    var getXField = function() {
        return this._params.binning.x;
    };

    var setYField = function(field) {
        if (field !== this._params.binning.y) {
            if (field === DEFAULT_Y_FIELD) {
                // reset if default
                this._params.binning.y = DEFAULT_Y_FIELD;
                this._params.binning.bottom = DEFAULT_PIXEL_MAX;
                this._params.binning.top = DEFAULT_PIXEL_MIN;
                this.clearExtrema();
            } else {
                var meta = this._meta[field];
                if (checkField(meta, field)) {
                    this._params.binning.y = field;
                    this._params.binning.bottom = meta.extrema.min;
                    this._params.binning.top = meta.extrema.max;
                    this.clearExtrema();
                }
            }
        }
        return this;
    };

    var getYField = function() {
        return this._params.binning.y;
    };

    var getLayerPointFromDataPoint = function(x, y, zoom) {
        var binning = this._params.binning;
        var tileSize = this.options.tileSize || DEFAULT_TILE_SIZE;
        var pow = Math.pow(2, zoom);
        var extent = tileSize * pow;
        var xRange = Math.abs(binning.right - binning.left);
        var yRange = Math.abs(binning.bottom - binning.top);
        var nx, ny;
        if (binning.left > binning.right) {
            nx = 1 - ((x - binning.right) / xRange);
        } else {
            nx = (x - binning.left) / xRange;
        }
        if (binning.top > binning.bottom) {
            ny = 1 - ((y - binning.bottom) / yRange);
        } else {
            ny = (y - binning.top) / yRange;
        }
        return {
            x: extent * nx,
            y: extent * ny
        };
    };

    var getDataPointFromLayerPoint = function(x, y, zoom) {
        var binning = this._params.binning;
        var tileSize = this.options.tileSize || DEFAULT_TILE_SIZE;
        var pow = Math.pow(2, zoom);
        var extent = tileSize * pow;
        var nx = x / extent;
        var ny = y / extent;
        var xRange = Math.abs(binning.right - binning.left);
        var yRange = Math.abs(binning.bottom - binning.top);
        var px, py;
        if (binning.left > binning.right) {
            px = binning.right + (1 - nx) * xRange;
        } else {
            px = binning.left + nx * xRange;
        }
        if (binning.top > binning.bottom) {
            py = binning.bottom + (1 - ny) * yRange;
        } else {
            py = binning.top + ny * yRange;
        }
        return {
            x: px,
            y: py
        };
    };

    module.exports = {
        setXField: setXField,
        getXField: getXField,
        setYField: setYField,
        getYField: getYField,
        getLayerPointFromDataPoint: getLayerPointFromDataPoint,
        getDataPointFromLayerPoint: getDataPointFromLayerPoint,
        DEFAULT_X_FIELD: DEFAULT_X_FIELD,
        DEFAULT_Y_FIELD: DEFAULT_Y_FIELD,
        DEFAULT_PIXEL_MAX: DEFAULT_PIXEL_MAX
    };

}());
