(function() {

    'use strict';

    // debug tile layer
    var Debug = require('./core/Debug');
    Debug.TileCoord = require('./debug/TileCoord');

    // pending tile layer
    var Pending = require('./core/Pending');
    Pending.Blink = require('./pending/Blink');
    Pending.Spin = require('./pending/Spin');

    // standard XYZ / TMX image layer
    var Image = require('./core/Image');

    // html tile layer
    var HTML = require('./core/HTML');
    HTML.Heatmap = require('./html/Heatmap');
    HTML.TopicCount = require('./html/TopicCount');
    HTML.TopicFrequency = require('./html/TopicFrequency');
    HTML.TopCount = require('./html/TopCount');
    HTML.TopFrequency = require('./html/TopFrequency');

    // canvas tile layer
    var Canvas = require('./core/Canvas');
    Canvas.Heatmap = require('./canvas/Heatmap');

    // webgl tile layer
    var WebGL = require('./core/WebGL');
    WebGL.Heatmap = require('./webgl/Heatmap');

    module.exports = {
        Debug: Debug,
        Pending: Pending,
        Image: Image,
        HTML: HTML,
        Canvas: Canvas,
        WebGL: WebGL
    };

}());
