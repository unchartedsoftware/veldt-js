'use strict';

const DEFAULT_RESOLUTION = 256;

const Tiling = require('./Tiling');

const setResolution = function(resolution) {
	if (resolution !== this._params.binning.resolution) {
		this._params.binning.resolution = resolution;
		this.clearExtrema();
	}
	return this;
};

const getResolution = function() {
	return this._params.binning.resolution || DEFAULT_RESOLUTION;
};

module.exports = {
	// tiling
	setXField: Tiling.setXField,
	getXField: Tiling.getXField,
	setYField: Tiling.setYField,
	getYField: Tiling.getYField,
	// binning
	setResolution: setResolution,
	getResolution: getResolution
};
