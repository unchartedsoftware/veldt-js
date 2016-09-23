(function() {

    'use strict';

    module.exports = function(meta, query) {
        if (!query.parent_type) {
            throw 'has-parent `parent_type` is missing from argument.';
        }
        if (!query.query) {
            throw 'has-parent `query` is missing from argument.';
        }
        if (!query.query.bool) {
            throw 'has-parent `query.bool` is missing from argument.';
        }
    };
}());
