(function() {

    'use strict';

    var _ = require('lodash');

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

    var normalizeTerms = function(prefixes) {
        prefixes = _.map(prefixes, function(t) {
            return t.toLowerCase();
        });
        prefixes.sort(function(a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
        return prefixes;
    };

    var addPrefixFilter = function(field, prefixes) {
        if (!field) {
            console.warn('PrefixFilter `field` is missing from argument. Ignoring command.');
            return;
        }
        if (prefixes === undefined) {
            console.warn('PrefixFilter `prefixes` are missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var filter = _.find(this._params.prefix_filter, function(filter) {
                return filter.field === field;
            });
            if (filter) {
                console.warn('Range with `field` of `' + field + '` already exists, used `updateRange` instead.');
                return;
            }
            this._params.prefix_filter = this._params.prefix_filter || [];
            this._params.prefix_filter.push({
                field: field,
                prefixes: normalizeTerms(prefixes)
            });
            this.clearExtrema();
        }
        return this;
    };

    var updatePrefixFilter = function(field, prefixes) {
        var filter = _.find(this._params.prefix_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        if (prefixes !== undefined) {
            filter.prefixes = normalizeTerms(prefixes);
            this.clearExtrema();
        }
        return this;
    };

    var removePrefixFilter = function(field) {
        var filter = _.find(this._params.prefix_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.prefix_filter = _.filter(this._params.prefix_filter, function(filter) {
            return filter.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getPrefixFilter = function() {
        return this._params.prefix_filter;
    };

    module.exports = {
        addPrefixFilter: addPrefixFilter,
        updatePrefixFilter: updatePrefixFilter,
        removePrefixFilter: removePrefixFilter,
        getPrefixFilter: getPrefixFilter
    };

}());
