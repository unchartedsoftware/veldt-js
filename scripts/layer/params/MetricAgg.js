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
                console.warn('Field `' + field + '` is not ordinal in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var setMetricAgg = function(field, type) {
        if (!field) {
            console.warn('MetricAgg `field` is missing from argument. Ignoring command.');
            return;
        }
        if (!type) {
            console.warn('MetricAgg `type` is missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            if (!METRICS[type]) {
                console.warn('MetricAgg type `' + type + '` is not supported. Ignoring command.');
                return;
            }
            this._params.metric_agg = {
                field: field,
                type: type
            };
            this.clearExtrema();
        }
        return this;
    };

    var getMetricAgg = function() {
        return this._params.metric_agg;
    };

    module.exports = {
        // tiling
        setMetricAgg: setMetricAgg,
        getMetricAgg: getMetricAgg,
    };

}());
