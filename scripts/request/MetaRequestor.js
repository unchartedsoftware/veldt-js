(function() {

    'use strict';

    const Requestor = require('./Requestor');

    class MetaRequestor extends Requestor {
        constructor(url, callback) {
            super(url, callback);
        }
        getHash(req) {
            return `${req.type}-${req.uri}-${req.store}`;
        }
        getURL(res) {
            return `meta/${res.type}/${res.endpoint}/${res.uri}/${res.store}`;
        }
    }

    module.exports = MetaRequestor;

}());
