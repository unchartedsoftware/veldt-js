(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not of type `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
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

    var setTermsAgg = function(field, terms) {
        if (!field) {
            console.warn('TermsAgg `field` is missing from argument. Ignoring command.');
            return;
        }
        if (terms === undefined) {
            console.warn('TermsAgg `terms` are missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            this._params.terms_agg = {
                field: field,
                terms: normalizeTerms(terms)
            };
            this.clearExtrema();
        }
        return this;
    };

    var getTermsAgg = function() {
        return this._params.terms_agg;
    };

    module.exports = {
        setTermsAgg: setTermsAgg,
        getTermsAgg: getTermsAgg
    };

}());
