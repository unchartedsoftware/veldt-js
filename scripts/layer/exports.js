(function() {

    'use strict';

    // debug tile layer
    let Debug = require('./core/Debug');

    // pending tile layer
    let Pending = require('./core/Pending');

    // image layer
    let Image = require('./core/Image');

    // composite layer
    let Composite = require('./core/Composite');

    // live layer - base type for extension
    let Live = require('./core/Live');

    // live tile layers
    let Heatmap = require('./type/Heatmap');
    let TopTrails = require('./type/TopTrails');
    let TopCount = require('./type/TopCount');
    let TopFrequency = require('./type/TopFrequency');
    let TopicCount = require('./type/TopicCount');
    let TopicFrequency = require('./type/TopicFrequency');
    let Preview = require('./type/Preview');
    let Macro = require('./type/Macro');
    let Micro = require('./type/Micro');
    let Count = require('./type/Count');
    let Community = require('./type/Community');

    module.exports = {
        Debug: Debug,
        Pending: Pending,
        Image: Image,
        Composite: Composite,
        Live: Live,
        Heatmap: Heatmap,
        TopCount: TopCount,
        TopTrails: TopTrails,
        TopFrequency: TopFrequency,
        TopicCount: TopicCount,
        TopicFrequency: TopicFrequency,
        Preview: Preview,
        Macro: Macro,
        Micro: Micro,
        Count: Count,
        Community: Community
    };

}());
