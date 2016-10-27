'use strict';

const setTermsFilter = function(field, terms) {
	if (!field) {
		throw 'TermsFilter `field` is missing from argument';
	}
	if (terms === undefined) {
		throw 'TermsFilter `terms` are missing from argument';
	}
	this._params.terms_filter = {
		field: field,
		terms: terms
	};
	this.clearExtrema();
	return this;
};

const getTermsFilter = function() {
	return this._params.terms_filter;
};

module.exports = {
	setTermsFilter: setTermsFilter,
	getTermsFilter: getTermsFilter
};
