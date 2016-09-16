(function() {

    'use strict';

    let stringify = require('json-stable-stringify');
    let Requestor = require('./Requestor');

    function pruneEmpty(obj) {
        return function prune(current) {
            _.forOwn(current, (value, key) => {
              if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value) ||
                (_.isString(value) && _.isEmpty(value)) ||
                (_.isObject(value) && _.isEmpty(prune(value)))) {
                delete current[key];
              }
            });
            // remove any leftover undefined values from the delete
            // operation on an array
            if (_.isArray(current)) {
                _.pull(current, undefined);
            }
            return current;
        }(_.cloneDeep(obj)); // do not modify the original object, create a clone instead
    }

    class TileRequestor extends Requestor {
        constructor(url, callback) {
            super(url, callback);
        }
        getHash(req) {
            let coord = req.coord;
            let hash = stringify(pruneEmpty(req.params));
            return `${req.type}-${req.uri}-${req.store}-${coord.z}-${coord.x}-${coord.y}-${hash}`;
        }
        getURL(res) {
            let coord = res.coord;
            return `tile/${res.type}/${res.uri}/${res.store}/${coord.z}/${coord.x}/${coord.y}`;
        }
    }

    module.exports = TileRequestor;

}());
