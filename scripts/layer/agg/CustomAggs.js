'use strict';

let setCustomAggs = function(aggs) {
	this._params.custom_aggs = {
		aggs: aggs
	};
};

module.exports = {
	setCustomAggs: setCustomAggs
};
