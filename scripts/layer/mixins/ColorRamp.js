(function() {

    'use strict';

    var ColorRampFuncs = require('../color/ColorRampFuncs');

    var setColorRamp = function(type) {
        var func = ColorRampFuncs[type.toLowerCase()];
        if (func) {
            this._colorRamp = func;
        }
        return this;
    };

    var getColorRamp = function() {
        return this._colorRamp;
    };

    var initialize = function() {
        this._colorRamp = ColorRampFuncs.verdant;
    };

    module.exports = {
        initialize: initialize,
        setColorRamp: setColorRamp,
        getColorRamp: getColorRamp
    };

}());
