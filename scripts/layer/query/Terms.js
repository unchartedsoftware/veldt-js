'use strict';

module.exports = function(meta, query) {
	if (!query.field) {
		throw 'Terms `field` is missing from argument.';
	}
	if (query.terms === undefined) {
		throw 'Terms `terms` are missing from argument.';
	}
	query.terms = Array.isArray(query.terms) ? query.terms : [ query.terms ];
};
