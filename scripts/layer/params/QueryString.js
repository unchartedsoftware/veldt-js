(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var addQueryString = function(field, str) {
        if (!field) {
            console.warn('QueryString `field` is missing from argument. Ignoring command.');
            return;
        }
        if (!str) {
            console.warn('QueryString `string` is missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var query = _.find(this._params.query_string, function(query) {
                return query.field === field;
            });
            if (query) {
                console.warn('QueryString with `field` of `' + field + '` already exists, used `updateQueryString` instead.');
                return;
            }
            this._params.query_string = this._params.query_string || [];
            this._params.query_string.push({
                field: field,
                string: str
            });
            this.clearExtrema();
        }
        return this;
    };

    var updateQueryString = function(field, str) {
        var query = _.find(this._params.query_string, function(query) {
            return query.field === field;
        });
        if (!query) {
            console.warn('QueryString with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        var changed = false;
        if (str !== undefined) {
            changed = true;
            query.string = str;
        }
        if (changed) {
            this.clearExtrema();
        }
        return this;
    };

    var removeQueryString = function(field) {
        var query = _.find(this._params.query_string, function(query) {
            return query.field === field;
        });
        if (!query) {
            console.warn('QueryString with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.query_string = _.filter(this._params.query_string, function(query) {
            return query.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getQueryString = function() {
        return this._params.query_string;
    };

    module.exports = {
        addQueryString: addQueryString,
        updateQueryString: updateQueryString,
        removeQueryString: removeQueryString,
        getQueryString: getQueryString
    };

}());
