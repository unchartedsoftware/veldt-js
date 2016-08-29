(function() {

    'use strict';

    let Requestor = require('./Requestor');

    class MetaRequestor extends Requestor {
        constructor(url, callback) {
            super(url, callback);
        }
        getHash(req) {
            return `${req.type}-${req.index}-${req.store}`;
        }
        getURL(res) {
            return `meta/${res.type}/${res.endpoint}/${res.index}/${res.store}`;
        }
    }

    module.exports = MetaRequestor;

}());
