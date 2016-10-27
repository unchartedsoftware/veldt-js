'use strict';

const setTerms = function(field, size) {
	if (!field) {
		throw 'Terms `field` is missing from argument';
	}
	this._params.terms = {
		field: field,
		size: size
	};
	this.clearExtrema();
	return this;
};

const getTerms = function() {
	return this._params.terms;
};

module.exports = {
	setTerms: setTerms,
	getTerms: getTerms
};
