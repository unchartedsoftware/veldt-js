(function() {

    'use strict';

    var _ = require('lodash');
    var Requestor = require('./Requestor');

    function TileRequestor() {
        Requestor.apply(this, arguments);
    }

    TileRequestor.prototype = Object.create(Requestor.prototype);

    TileRequestor.prototype.getHash = function(req) {
        var coord = req.coord;
        var params = [];
        _.forIn(req.params, function(param, paramName) {
            if (param) {
                var strs = [paramName];
                _.forIn(param, function(val, key) {
                    if (val !== undefined && val !== null) {
                        strs.push(key.toLowerCase() + '=' + val);
                    }
                });
                strs.sort();
                params.push(strs.join(','));
            }
        });
        params.sort();
        return req.type + '-' +
            req.index + '-' +
            req.store + '-' +
            coord.x + '-' +
            coord.y + '-' +
            coord.z + '-' +
            params.join('-');
    };

    TileRequestor.prototype.getURL = function(res) {
        var coord = res.coord;
        return 'tile/' +
            res.type + '/' +
            res.index + '/' +
            res.store + '/' +
            coord.z + '/' +
            coord.x + '/' +
            coord.y;
    };

    module.exports = TileRequestor;

}());
