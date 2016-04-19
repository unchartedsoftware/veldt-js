(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                throw 'Field `' + field + '` is not of type `string` in meta data';
            }
        } else {
            throw 'Field `' + field + '` is not recognized in meta data';
        }
        return false;
    };

    var setTopTerms = function(field, size) {
        if (!field) {
            throw 'TopTerms `field` is missing from argument';
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            this._params.top_terms = {
                field: field,
                size: size
            };
            this.clearExtrema();
        }
        return this;
    };

    var getTopTerms = function() {
        return this._params.top_terms;
    };

    module.exports = {
        setTopTerms: setTopTerms,
        getTopTerms: getTopTerms
    };

}());
