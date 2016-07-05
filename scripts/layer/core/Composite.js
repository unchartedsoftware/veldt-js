(function() {

    'use strict';

    function validToCopy(funcName) {
        return funcName !== 'constructor' &&
            funcName[0] !== '_';
    }

    var Composite = L.Class.extend({

        initialize: function(layers) {
            layers = layers || [];
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
                self._extend(func);
            });
            this.layers = layers;
            this.functions = functions;
        },

        _extend: function(func) {
            var self = this;
            this[func] = function() {
                var layers = self.functions[func];
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
        },

        addSubLayer: function(layer) {
            var index = this.layers.indexOf(layer);
            if (index !== -1) {
                return;
            }
            var self = this;
            var functions = this.functions;
            _.forIn(layer, function(val, key) {
                // if it is a function and valid to copy
                if (_.isFunction(val) && validToCopy(key)) {
                    // add layer to functions
                    functions[key] = functions[key] || [];
                    functions[key].push(layer);
                    if (functions[key].length === 1) {
                        // if a new function, extend the object
                        self._extend(key);
                    }
                }
            });
            // add to layers
            this.layers.push(layer);
        },

        removeSubLayer: function(layer) {
            var index = this.layers.indexOf(layer);
            if (index === -1) {
                return;
            }
            var functions = this.functions;
            var self = this;
            // remove all functions used exclusively by this layer
            _.forIn(layer, function(val, key) {
                if (_.isFunction(val) && validToCopy(key)) {
                    var index = functions[key].indexOf(layer);
                    if (index !== -1) {
                        // remove from function list
                        functions[key].splice(index, 1);
                    }
                    // if exclusive owner of function
                    if (functions[key].length === 0) {
                        // no more use for this function, remove it
                        delete functions[key];
                        delete self[key];
                    }
                }
            });
            // remove layer
            this.layers.splice(index, 1);
        }
    });

    module.exports = Composite;

}());
