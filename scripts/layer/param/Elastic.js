(function() {

    'use strict';

    const getTypes = function() {
        return this._params.elastic ? this._params.elastic.type : undefined;
    };

    const setTypes = function(types) {
        if (!types) {
            throw 'QueryString `types` are not provided.';
        }
        types = Array.isArray(types) ? types : [ types ];
        this._params.elastic = {
            types: types
        };
    };

    module.exports = {
        setTypes: setTypes,
        getTypes: getTypes
    };

}());
