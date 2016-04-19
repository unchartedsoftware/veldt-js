(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type !== 'string') {
                throw 'Field `' + field + '` is not of type `string` in meta data';
            }
        }
        throw 'Field `' + field + '` is not recognized in meta data';
    };

    var setTerms = function(field, terms) {
        if (!field) {
            throw 'Terms `field` is missing from argument';
        }
        if (terms === undefined) {
            throw 'Terms `terms` are missing from argument';
        }
        checkField(this._meta[field], field)
        this._params.terms = {
            field: field,
            terms: terms
        };
        this.clearExtrema();
        return this;
    };

    var getTerms = function() {
        return this._params.terms;
    };

    module.exports = {
        setTerms: setTerms,
        getTerms: getTerms
    };

}());
