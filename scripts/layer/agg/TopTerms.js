(function() {

    'use strict';

    const setTopTerms = function(field, size) {
        if (!field) {
            throw 'TopTerms `field` is missing from argument';
        }
        this._params.top_terms = {
            field: field,
            size: size
        };
        this.clearExtrema();
        return this;
    };

    const getTopTerms = function() {
        return this._params.top_terms;
    };

    module.exports = {
        setTopTerms: setTopTerms,
        getTopTerms: getTopTerms
    };

}());
