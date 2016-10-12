(function() {

    'use strict';

    const moment = require('moment');

    const DEFAULT_TILE_SIZE = 256;
    const DEFAULT_X_FIELD = 'pixel.x';
    const DEFAULT_Y_FIELD = 'pixel.y';
    const DEFAULT_PIXEL_MIN = 0;
    const DEFAULT_PIXEL_MAX = Math.pow(2, 32);

    const checkField = function(meta, field) {
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

    const setXField = function(field, type, relationship) {
        if (field !== this._params.binning.x) {
            if (field.indexOf(DEFAULT_X_FIELD) !== -1) {
                // reset if default
                this._params.binning.x = field;
                this._params.binning.left = DEFAULT_PIXEL_MIN;
                this._params.binning.right = DEFAULT_PIXEL_MAX;
                this.clearExtrema();
            } else {
                const meta = this._meta[field];
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

    const getXField = function() {
        return this._params.binning.x;
    };

    const setYField = function(field, type, relationship) {
        if (field !== this._params.binning.y) {
            if (field.indexOf(DEFAULT_Y_FIELD) !== -1) {
                // reset if default
                this._params.binning.y = field;
                this._params.binning.bottom = DEFAULT_PIXEL_MAX;
                this._params.binning.top = DEFAULT_PIXEL_MIN;
                this.clearExtrema();
            } else {
                const meta = this._meta[field];
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

    const getYField = function() {
        return this._params.binning.y;
    };

    const getLayerPointFromDataPoint = function(x, y, zoom) {
        const binning = this._params.binning;
        const tileSize = this.options.tileSize || DEFAULT_TILE_SIZE;
        const pow = Math.pow(2, zoom);
        const extent = tileSize * pow;
        const meta = this.getMeta();

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

        const xRange = Math.abs(right - left);
        const yRange = Math.abs(bottom - top);
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

    const getDataPointFromLayerPoint = function(x, y, zoom) {
        const binning = this._params.binning;
        const tileSize = this.options.tileSize || DEFAULT_TILE_SIZE;
        const pow = Math.pow(2, zoom);
        const extent = tileSize * pow;
        const nx = x / extent;
        const ny = y / extent;
        const xRange = Math.abs(binning.right - binning.left);
        const yRange = Math.abs(binning.bottom - binning.top);
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
