(function() {

    'use strict';

    let moment = require('moment');

    let DEFAULT_TILE_SIZE = 256;
    let DEFAULT_X_FIELD = 'pixel.x';
    let DEFAULT_Y_FIELD = 'pixel.y';
    let DEFAULT_PIXEL_MIN = 0;
    let DEFAULT_PIXEL_MAX = Math.pow(2, 32);

    let checkField = function(meta, field) {
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

    let setXField = function(field, type, relationship) {
        if (field !== this._params.binning.x) {
            if (field.indexOf(DEFAULT_X_FIELD) !== -1) {
                // reset if default
                this._params.binning.x = field;
                this._params.binning.left = DEFAULT_PIXEL_MIN;
                this._params.binning.right = DEFAULT_PIXEL_MAX;
                this.clearExtrema();
            } else {
                let meta = this._meta[field];
                if (checkField(meta, field)) {
                    this._params.binning.x = field;
                    this._params.binning.left = meta.extrema.min;
                    this._params.binning.right = meta.extrema.max;
                    this.clearExtrema();
                }
            }
        }
        this._params.binning.xType = type;
        this._params.binning.xRelationship = relationship;
        return this;
    };

    let getXField = function() {
        return this._params.binning.x;
    };

    let setYField = function(field, type, relationship) {
        if (field !== this._params.binning.y) {
            if (field.indexOf(DEFAULT_Y_FIELD) !== -1) {
                // reset if default
                this._params.binning.y = field;
                this._params.binning.bottom = DEFAULT_PIXEL_MAX;
                this._params.binning.top = DEFAULT_PIXEL_MIN;
                this.clearExtrema();
            } else {
                let meta = this._meta[field];
                if (checkField(meta, field)) {
                    this._params.binning.y = field;
                    this._params.binning.bottom = meta.extrema.min;
                    this._params.binning.top = meta.extrema.max;
                    this.clearExtrema();
                }
            }
        }
        this._params.binning.yType = type;
        this._params.binning.yRelationship = relationship;
        return this;
    };

    let getYField = function() {
        return this._params.binning.y;
    };

    let getLayerPointFromDataPoint = function(x, y, zoom) {
        let binning = this._params.binning;
        let tileSize = this.options.tileSize || DEFAULT_TILE_SIZE;
        let pow = Math.pow(2, zoom);
        let extent = tileSize * pow;
        let meta = this.getMeta();

        let left, right, bottom, top;
        if (meta[binning.x].type === 'date') {
            left = moment(binning.left).valueOf();
            right = moment(binning.right).valueOf();
            x = moment(x).valueOf();
        } else {
            left = binning.left;
            right = binning.right;
        }
        if (meta[binning.y].type === 'date') {
            bottom = moment(binning.bottom).valueOf();
            top = moment(binning.top).valueOf();
            y = moment(y).valueOf();
        } else {
            bottom = binning.bottom;
            top = binning.top;
        }

        let xRange = Math.abs(right - left);
        let yRange = Math.abs(bottom - top);
        let nx, ny;
        if (left > right) {
            nx = 1 - ((x - right) / xRange);
        } else {
            nx = (x - left) / xRange;
        }
        if (top > bottom) {
            ny = 1 - ((y - bottom) / yRange);
        } else {
            ny = (y - top) / yRange;
        }
        return {
            x: extent * nx,
            y: extent * ny
        };
    };

    let getDataPointFromLayerPoint = function(x, y, zoom) {
        let binning = this._params.binning;
        let tileSize = this.options.tileSize || DEFAULT_TILE_SIZE;
        let pow = Math.pow(2, zoom);
        let extent = tileSize * pow;
        let nx = x / extent;
        let ny = y / extent;
        let xRange = Math.abs(binning.right - binning.left);
        let yRange = Math.abs(binning.bottom - binning.top);
        let px, py;
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
