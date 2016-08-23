(function () {

    'use strict';

    module.exports = {
        Map: require('./map/Map'),
        Projection: require('./projection/exports'),
        CRS: require('./CRS/exports'),
        TileLayer: require('./layer/exports'),
        Renderer: require('./renderer/exports'),
        TileRequestor: require('./request/TileRequestor'),
        MetaRequestor: require('./request/MetaRequestor'),
        ColorRamp: {
            // expose as static method
            getColorRamp: require('./renderer/mixin/ColorRamp').getColorRamp
        }
    };

}());
