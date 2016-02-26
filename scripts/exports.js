(function () {

    'use strict';

    module.exports = {
        TileLayer: require('./layer/TileLayer'),
        Renderer: require('./layer/Renderer'),
        TileRequestor: require('./request/TileRequestor'),
        MetaRequestor: require('./request/MetaRequestor')
    };

}());
