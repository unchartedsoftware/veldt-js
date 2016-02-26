(function() {

    'use strict';

    var setDateHistogram = function(field, from, to, interval) {
        if (!field) {
            console.warn('DateHistogram `field` is missing from argument. Ignoring command.');
            return;
        }
        if (from === undefined) {
            console.warn('DateHistogram `from` are missing from argument. Ignoring command.');
            return;
        }
        if (to === undefined) {
            console.warn('DateHistogram `to` are missing from argument. Ignoring command.');
            return;
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

    var getDateHistogram = function() {
        return this._params.date_histogram;
    };

    module.exports = {
        setDateHistogram: setDateHistogram,
        getDateHistogram: getDateHistogram
    };

}());
