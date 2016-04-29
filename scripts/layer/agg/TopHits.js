// Provides top hits query functionality. 'size' indicates the number of top 
// hits to return, 'include' is the list of fields to include in the returned 
// data, 'sort' is the field to use for sort critera, and 'order' is value of
// 'asc' or 'desc' to indicate sort ordering.
(function() {

    'use strict';

    var setTopHits = function(size, include, sort, order) {
        this._params.top_hits = {
            size: size, 
            include:include,
            sort: sort,
            order: order            
        };
        this.clearExtrema();
        return this;
    };

    var getTopHits = function() {
        return this._params.top_hits;
    };

    // bind point for external controls
    var setSortField = function(sort) {
        this._params.top_hits.sort = sort;
        return this;
    };

    // bind point for external controls
    var getSortField = function() {
        return this._params.top_hits.sort;
    };

    module.exports = {
        setTopHits: setTopHits,
        getTopHits: getTopHits,
        setSortField: setSortField,
        getSortField: getSortField
    };

}());
