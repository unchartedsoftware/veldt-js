(function() {

    'use strict';

    var getThreshold = function() {
        return this._params.macro_micro.threshold;
    };

    var setThreshold = function(threshold) {
        this._params.macro_micro = {
            threshold: threshold
        };
    };

    module.exports = {
        setThreshold: setThreshold,
        getThreshold: getThreshold
    };

}());
