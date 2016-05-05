(function() {

    'use strict';

    // debug tile layer
    var Debug = require('./core/Debug');

    // pending tile layer
    var Pending = require('./core/Pending');

    // base tile layer
    var Tile = require('./core/Tile');

    // live tile layers
    var Heatmap = require('./type/Heatmap');
    var TopTrails = require('./type/TopTrails');
    var TopCount = require('./type/TopCount');
    var TopFrequency = require('./type/TopFrequency');
    var TopicCount = require('./type/TopicCount');
    var TopicFrequency = require('./type/TopicFrequency');
    var Preview = require('./type/Preview');

    module.exports = {
        Debug: Debug,
        Pending: Pending,
        Tile: Tile,
        Heatmap: Heatmap,
        TopCount: TopCount,
        TopTrails: TopTrails,
        TopFrequency: TopFrequency,
        TopicCount: TopicCount,
        TopicFrequency: TopicFrequency,
        Preview: Preview
    };

}());
