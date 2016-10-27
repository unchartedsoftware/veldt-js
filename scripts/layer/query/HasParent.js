'use strict';

module.exports = function(meta, query) {
	if (!query.parent_type) {
		throw 'HasParent `parent_type` is missing from argument.';
	}
	if (!query.query) {
		throw 'HasParent `query` is missing from argument.';
	}
	if (!query.query.bool) {
		throw 'HasParent `query.bool` is missing from argument.';
	}
};
