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

    var normalizeTerms = function(terms) {
        terms.sort(function(a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
        return terms;
    };

    var setTerms = function(field, terms) {
        if (!field) {
            throw 'Terms `field` is missing from argument';
        }
        if (terms === undefined) {
            throw 'Terms `terms` are missing from argument';
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            this._params.terms = {
                field: field,
                terms: normalizeTerms(terms)
            };
            this.clearExtrema();
        }
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
