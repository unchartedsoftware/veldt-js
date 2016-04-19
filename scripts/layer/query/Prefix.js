(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type !== 'string') {
                throw 'Field `' + field + '` is not of type `string` in meta data.';
            }
        }
        throw 'Field `' + field + '` is not recognized in meta data.';
    };

    module.exports = function(meta, query) {
        if (!query.field) {
            throw 'Prefix `field` is missing from argument';
        }
        if (query.prefixes === undefined) {
            throw 'Prefix `prefixes` are missing from argument';
        }
        checkField(meta[query.field], query.field);
    };

}());
