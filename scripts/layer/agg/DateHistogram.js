(function() {

    'use strict';

    const setDateHistogram = function(field, from, to, interval) {
        if (!field) {
            throw 'DateHistogram `field` is missing from argument';
        }
        if (from === undefined) {
            throw 'DateHistogram `from` are missing from argument';
        }
        if (to === undefined) {
            throw 'DateHistogram `to` are missing from argument';
        }
        this._params.date_histogram = {
            field: field,
            from: from,
            to: to,
            interval: interval
        };
        this.clearExtrema();
        return this;
    };

    const getDateHistogram = function() {
        return this._params.date_histogram;
    };

    module.exports = {
        setDateHistogram: setDateHistogram,
        getDateHistogram: getDateHistogram
    };

}());
