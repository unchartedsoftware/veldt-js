(function() {

    'use strict';

    var setHistogram = function(field, interval) {
        if (!field) {
            console.warn('Histogram `field` is missing from argument. Ignoring command.');
            return;
        }
        if (!interval) {
            console.warn('Histogram `interval` are missing from argument. Ignoring command.');
            return;
        }
        this._params.histogram = {
            field: field,
            interval: interval
        };
        this.clearExtrema();
        return this;
    };

    var getHistogram = function() {
        return this._params.histogram;
    };

    module.exports = {
        setHistogram: setHistogram,
        getHistogram: getHistogram
    };

}());
