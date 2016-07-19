(function() {

    'use strict';

    function validToCopy(funcName) {
        return funcName !== 'constructor' &&
            funcName !== 'on' &&
            funcName !== 'off' &&
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
            // set properties
            this._layers = layers;
            this._functions = functions;
            this._handlers = {};
            // extend this composite class for each function
            var self = this;
            _.forIn(functions, function(layers, func) {
                self._extend(func);
            });
        },

        on: function(evt, func) {
            this._layers.forEach(function(layer) {
                layer.on(evt, func);
            });
            this._handlers[evt] = this._handlers[evt] || [];
            this._handlers[evt].push(func);
        },

        off: function(evt, func) {
            var handlers = this._handlers[evt];
            if (handlers) {
                var index = handlers.indexOf(func);
                if (index !== -1) {
                    this._layers.forEach(function(layer) {
                        layer.off(evt, func);
                    });
                    handlers.splice(index, 1);
                    if (handlers.length === 0) {
                        delete this._handlers[evt];
                    }
                }
            }
        },

        _extend: function(func) {
            var functions = this._functions;
            this[func] = function() {
                var layers = functions[func];
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
            var index = this._layers.indexOf(layer);
            if (index !== -1) {
                return;
            }
            var self = this;
            var functions = this._functions;
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
            this._layers.push(layer);
            // add handlers to layer
            _.forIn(this._handlers, function(handlers, evt) {
                handlers.forEach(function(func) {
                    layer.on(evt, func);
                });
            });
        },

        removeSubLayer: function(layer) {
            var index = this._layers.indexOf(layer);
            if (index === -1) {
                return;
            }
            var functions = this._functions;
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
            this._layers.splice(index, 1);
            // remove handlers from layer
            _.forIn(this._handlers, function(handlers, evt) {
                handlers.forEach(function(func) {
                    layer.off(evt, func);
                });
            });
        }
    });

    module.exports = Composite;

}());
