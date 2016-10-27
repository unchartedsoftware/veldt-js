'use strict';

const checkField = function(meta, field) {
	if (meta) {
		if (!meta.extrema) {
			throw 'TopHits `field` ' + field + ' is not ordinal in meta data.';
		}
	} else {
		throw 'TopHits `field` ' + field + ' is not recognized in meta data';
	}
};

const setTopHits = function(size, include, sort, order) {
	if (sort) {
		checkField(this._meta[sort], sort);
	}
	this._params.top_hits = {
		size: size,
		include: include,
		sort: sort,
		order: order
	};
	this.clearExtrema();
	return this;
};

const getTopHits = function() {
	return this._params.top_hits;
};

module.exports = {
	setTopHits: setTopHits,
	getTopHits: getTopHits
};
