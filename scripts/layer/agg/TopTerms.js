(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type !== 'string') {
                throw 'TopTerms `field` ' + field + ' is not of type `string` in meta data';
            }
        } else {
            throw 'TopTerms `field` ' + field + ' is not recognized in meta data';
        }
    };

    var setTopTerms = function(field, size) {
        if (!field) {
            throw 'TopTerms `field` is missing from argument';
        }
        checkField(this._meta[field], field);
        this._params.top_terms = {
            field: field,
            size: size
        };
        this.clearExtrema();
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
