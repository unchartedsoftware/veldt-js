'use strict';

module.exports = function(meta, query) {
	if (!query.type) {
		throw 'HasChild `type` is missing from argument.';
	}
	if (!query.query) {
		throw 'HasChild `query` is missing from argument.';
	}
	if (!query.query.bool) {
		throw 'HasChild `query.bool` is missing from argument.';
	}
};
