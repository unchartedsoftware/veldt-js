(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.extrema) {
                return true;
            } else {
                throw 'Field `' + field + '` is not ordinal in meta data.';
            }
        } else {
            throw 'Field `' + field + '` is not recognized in meta data.';
        }
        return false;
    };

    module.exports = function(meta, query) {
        if (!query.field) {
            throw 'Range `field` is missing from argument.';
        }
        if (query.from === undefined) {
            throw 'Range `from` is missing from argument.';
        }
        if (query.to === undefined) {
            throw 'Range `to` is missing from argument.';
        }
        checkField(meta[query.field], query.field);
    };

}());
