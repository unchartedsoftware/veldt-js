(function() {

    'use strict';

    var METRICS = {
        'min': true,
        'max': true,
        'sum': true,
        'avg': true
    };

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.extrema) {
                return true;
            } else {
                throw 'Field `' + field + '` is not ordinal in meta data';
            }
        } else {
            throw 'Field `' + field + '` is not recognized in meta data';
        }
        return false;
    };

    var setMetric = function(field, type) {
        if (!field) {
            throw 'Metric `field` is missing from argument';
        }
        if (!type) {
            throw 'Metric `type` is missing from argument';
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            if (!METRICS[type]) {
                throw 'Metric type `' + type + '` is not supported';
            }
            this._params.metric = {
                field: field,
                type: type
            };
            this.clearExtrema();
        }
        return this;
    };

    var getMetric = function() {
        return this._params.metric;
    };

    module.exports = {
        // tiling
        setMetric: setMetric,
        getMetric: getMetric,
    };

}());
