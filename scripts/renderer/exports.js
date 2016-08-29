(function() {

    'use strict';

    var Core = {
        HTML: require('./core/HTML'),
        WebGL: require('./core/WebGL'),
        Canvas: require('./core/Canvas')
    };

    // canvas renderers
    var Canvas = {
        Heatmap: require('./type/canvas/Heatmap'),
        TopTrails: require('./type/canvas/TopTrails'),
        Preview: require('./type/canvas/Preview')
    };

    // html renderers
    var HTML = {
        Empty: require('./type/html/Empty'),
        Heatmap: require('./type/html/Heatmap'),
        Ring: require('./type/html/Ring'),
        WordCloud: require('./type/html/WordCloud'),
        WordHistogram: require('./type/html/WordHistogram'),
        Community: require('./type/html/Community'),
        CommunityLabel: require('./type/html/CommunityLabel')
    };

    // webgl renderers
    var WebGL = {
        Heatmap: require('./type/webgl/Heatmap'),
        Point: require('./type/webgl/Point')
    };

    // pending layer renderers
    var Pending = {
        DelayedBlink: require('./type/pending/DelayedBlink'),
        DelayedSpin: require('./type/pending/DelayedSpin'),
        Blink: require('./type/pending/Blink'),
        Spin: require('./type/pending/Spin'),
        BlinkSpin: require('./type/pending/BlinkSpin')
    };

    // pending layer renderers
    var Debug = {
        Coord: require('./type/debug/Coord')
    };

    module.exports = {
        Core: Core,
        HTML: HTML,
        Canvas: Canvas,
        WebGL: WebGL,
        Debug: Debug,
        Pending: Pending
    };

}());
