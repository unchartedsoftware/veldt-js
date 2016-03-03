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

    var addTermsFilter = function(field, terms) {
        if (!field) {
            console.warn('TermsFilter `field` is missing from argument. Ignoring command.');
            return;
        }
        if (terms === undefined) {
            console.warn('TermsFilter `terms` are missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var filter = _.find(this._params.terms_filter, function(filter) {
                return filter.field === field;
            });
            if (filter) {
                console.warn('TermsFilter with `field` of `' + field + '` already exists, used `updateRange` instead.');
                return;
            }
            this._params.terms_filter = this._params.terms_filter || [];
            this._params.terms_filter.push({
                field: field,
                terms: normalizeTerms(terms)
            });
            this.clearExtrema();
        }
        return this;
    };

    var updateTermsFilter = function(field, terms) {
        var filter = _.find(this._params.terms_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        if (terms !== undefined) {
            filter.terms = normalizeTerms(terms);
            this.clearExtrema();
        }
        return this;
    };

    var removeTermsFilter = function(field) {
        var filter = _.find(this._params.terms_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.terms_filter = _.filter(this._params.terms_filter, function(filter) {
            return filter.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getTermsFilter = function() {
        return this._params.terms_filter;
    };

    module.exports = {
        addTermsFilter: addTermsFilter,
        updateTermsFilter: updateTermsFilter,
        removeTermsFilter: removeTermsFilter,
        getTermsFilter: getTermsFilter
    };

}());
