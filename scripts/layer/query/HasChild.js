(function() {

    'use strict';

    module.exports = function(meta, query) {
        if (!query.type) {
            throw 'has-child `type` is missing from argument.';
        }
        if (!query.query) {
            throw 'has-child `query` is missing from argument.';
        }
        if (!query.query.bool) {
            throw 'has-child `query.bool` is missing from argument.';
        }
    };
}());
