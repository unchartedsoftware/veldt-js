(function() {

    'use strict';

    function validToCopy(funcName) {
        return funcName !== 'constructor' &&
            funcName[0] !== '_';
    }

    var Composite = L.Class.extend({

        initialize: function(layers) {
            var functions = {};
            // get a list of all functions for each layer
            layers.forEach(function(layer) {
                _.forIn(layer, function(val, key) {
                    if (_.isFunction(val) && validToCopy(key)) {
                        functions[key] = functions[key] || [];
                        functions[key].push(layer);
                    }
                });
            });
            // extend this composite class for each function
            var self = this;
            _.forIn(functions, function(layers, func) {
                self._extend(layers, func);
            });
        },

        _extend: function(layers, func) {
            this[func] = function() {
                var layer, i;
                var result;
                for (i=0; i<layers.length; i++) {
                    layer = layers[i];
                    result = layer[func].apply(layer, arguments);
                    if (result !== undefined && result !== layer) {
                        return result;
                    }
                }
            };
        }

    });

    module.exports = Composite;

}());
