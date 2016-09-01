(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type !== 'string') {
                throw 'Match `field` ' + field + ' is not `string` in meta data.';
            }
        } else {
            throw 'Match `field` ' + field + ' is not recognized in meta data.';
        }
    };

    module.exports = function(meta, query) {
        if (!query.field) {
            throw 'Match `field` is missing from argument.';
        }
        if (!query.string) {
            throw 'Match `string` is missing from argument.';
        }
        checkField(meta[query.field], query.field);
    };

}());
