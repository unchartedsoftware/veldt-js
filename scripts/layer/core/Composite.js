(function() {

    'use strict';

    function validToCopy(funcName) {
        return funcName !== 'constructor' &&
            funcName !== 'on' &&
            funcName !== 'off' &&
            funcName !== 'setQuery' &&
            funcName !== 'clearQuery' &&
            funcName[0] !== '_';
    }

    let Composite = L.Class.extend({

        initialize: function(layers = []) {
            let functions = {};
            // get a list of all functions for each layer
            layers.forEach(layer => {
                _.forIn(layer, (val, key) => {
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
            this._query = null;
            // extend this composite class for each function
            _.forIn(functions, (layers, func) => {
                this._extend(func);
            });
        },

        on: function(evt, func) {
            this._layers.forEach(layer => {
                layer.on(evt, func);
            });
            this._handlers[evt] = this._handlers[evt] || [];
            this._handlers[evt].push(func);
        },

        off: function(evt, func) {
            let handlers = this._handlers[evt];
            if (handlers) {
                let index = handlers.indexOf(func);
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

        setQuery: function(query) {
            this._layers.forEach(layer => {
                layer.setQuery(query);
            });
            this._query = query;
        },

        clearQuery: function() {
            if (this._query) {
                this._layers.forEach(function(layer) {
                    layer.clearQuery();
                });
                this._query = null;
            }
        },

        _extend: function(func) {
            let functions = this._functions;
            this[func] = function() {
                let layers = functions[func];
                let layer, i;
                let result;
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
            let index = this._layers.indexOf(layer);
            if (index !== -1) {
                return;
            }
            let functions = this._functions;
            _.forIn(layer, (val, key) => {
                // if it is a function and valid to copy
                if (_.isFunction(val) && validToCopy(key)) {
                    // add layer to functions
                    functions[key] = functions[key] || [];
                    functions[key].push(layer);
                    if (functions[key].length === 1) {
                        // if a new function, extend the object
                        this._extend(key);
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
            if (this._query) {
                // add query to layer
                layer.setQuery(this._query);
            }
        },

        removeSubLayer: function(layer) {
            let index = this._layers.indexOf(layer);
            if (index === -1) {
                return;
            }
            let functions = this._functions;
            // remove all functions used exclusively by this layer
            _.forIn(layer, (val, key) => {
                if (_.isFunction(val) && validToCopy(key)) {
                    let index = functions[key].indexOf(layer);
                    if (index !== -1) {
                        // remove from function list
                        functions[key].splice(index, 1);
                    }
                    // if exclusive owner of function
                    if (functions[key].length === 0) {
                        // no more use for this function, remove it
                        delete functions[key];
                        delete this[key];
                    }
                }
            });
            // remove layer
            this._layers.splice(index, 1);
            // remove handlers from layer
            _.forIn(this._handlers, (handlers, evt) => {
                handlers.forEach(func => {
                    layer.off(evt, func);
                });
            });
            // clear the query from the layer
            layer.clearQuery();
        }
    });

    module.exports = Composite;

}());
