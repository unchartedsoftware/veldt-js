(function() {

    'use strict';

    let getTypes = function() {
        return this._params.elastic ? this._params.elastic.type : undefined;
    };

    let setTypes = function(types) {
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
