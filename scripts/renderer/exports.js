(function() {

    'use strict';

    // canvas renderers
    var Canvas = {
        Heatmap: require('./types/canvas/Heatmap')
    };

    // html renderers
    var HTML = {
        Heatmap: require('./types/html/Heatmap'),
        Ring: require('./types/html/Ring'),
        WordCloud: require('./types/html/WordCloud'),
        WordHistogram: require('./types/html/WordHistogram')
    };

    // webgl renderers
    var WebGL = {
        Heatmap: require('./types/webgl/Heatmap')
    };

    // pending layer renderers
    var Pending = {
        Blink: require('./types/pending/Blink'),
        Spin: require('./types/pending/Spin'),
        BlinkSpin: require('./types/pending/BlinkSpin'),
    };

    // pending layer renderers
    var Debug = {
        Coord: require('./types/debug/Coord')
    };

    module.exports = {
        HTML: HTML,
        Canvas: Canvas,
        WebGL: WebGL,
        Debug: Debug,
        Pending: Pending
    };

}());
