(function() {

    'use strict';

    let DEFAULT_RESOLUTION = 256;

    let Tiling = require('./Tiling');

    let setResolution = function(resolution) {
        if (resolution !== this._params.binning.resolution) {
            this._params.binning.resolution = resolution;
            this.clearExtrema();
        }
        return this;
    };

    let getResolution = function() {
        return this._params.binning.resolution || DEFAULT_RESOLUTION;
    };

    module.exports = {
        // tiling
        setXField: Tiling.setXField,
        getXField: Tiling.getXField,
        setYField: Tiling.setYField,
        getYField: Tiling.getYField,
        getLayerPointFromDataPoint: Tiling.getLayerPointFromDataPoint,
        getDataPointFromLayerPoint: Tiling.getDataPointFromLayerPoint,
        DEFAULT_X_FIELD: Tiling.DEFAULT_X_FIELD,
        DEFAULT_Y_FIELD: Tiling.DEFAULT_Y_FIELD,
        DEFAULT_PIXEL_MAX: Tiling.DEFAULT_PIXEL_MAX,
        // binning
        setResolution: setResolution,
        getResolution: getResolution,
        DEFAULT_RESOLUTION: DEFAULT_RESOLUTION
    };

}());
