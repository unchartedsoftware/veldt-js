(function() {

    'use strict';

    // canvas renderers
    var Canvas = {
        Heatmap: require('./type/canvas/Heatmap')
    };

    // html renderers
    var HTML = {
        Heatmap: require('./type/html/Heatmap'),
        TopTrails: require('./type/html/TopTrails'),
        Ring: require('./type/html/Ring'),
        WordCloud: require('./type/html/WordCloud'),
        WordHistogram: require('./type/html/WordHistogram')
    };

    // webgl renderers
    var WebGL = {
        Heatmap: require('./type/webgl/Heatmap')
    };

    // pending layer renderers
    var Pending = {
        Blink: require('./type/pending/Blink'),
        Spin: require('./type/pending/Spin'),
        BlinkSpin: require('./type/pending/BlinkSpin'),
    };

    // pending layer renderers
    var Debug = {
        Coord: require('./type/debug/Coord')
    };

    module.exports = {
        HTML: HTML,
        Canvas: Canvas,
        WebGL: WebGL,
        Debug: Debug,
        Pending: Pending
    };

}());
