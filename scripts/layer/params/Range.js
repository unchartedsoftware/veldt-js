(function() {

    'use strict';

    var _ = require('lodash');

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.extrema) {
                return true;
            } else {
                console.warn('Field `' + field + '` is not ordinal in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var addRange = function(field, from, to) {
        if (!field) {
            console.warn('Range `field` is missing from argument. Ignoring command.');
            return;
        }
        if (from === undefined) {
            console.warn('Range `from` is missing from argument. Ignoring command.');
            return;
        }
        if (to === undefined) {
            console.warn('Range `to` is missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var range = _.find(this._params.range, function(range) {
                return range.field === field;
            });
            if (range) {
                console.warn('Range with `field` of `' + field + '` already exists, used `updateRange` instead.');
                return;
            }
            this._params.range.push({
                field: field,
                from: from,
                to: to
            });
            this.clearExtrema();
        }
        return this;
    };

    var updateRange = function(field, from, to) {
        var range = _.find(this._params.range, function(range) {
            return range.field === field;
        });
        if (!range) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        var changed = false;
        if (from !== undefined) {
            changed = true;
            range.from = from;
        }
        if (to !== undefined) {
            changed = true;
            range.to = to;
        }
        if (changed) {
            this.clearExtrema();
        }
        return this;
    };

    var removeRange = function(field) {
        var range = _.find(this._params.range, function(range) {
            return range.field === field;
        });
        if (!range) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.range = _.filter(this._params.range, function(range) {
            return range.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getRange = function() {
        return this._params.range;
    };

    module.exports = {
        addRange: addRange,
        updateRange: updateRange,
        removeRange: removeRange,
        getRange: getRange
    };

}());
