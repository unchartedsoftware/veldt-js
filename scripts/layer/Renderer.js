(function() {

    'use strict';

    // canvas renderers
    var Canvas = {
        Heatmap: require('./canvas/renderer/Heatmap')
    };

    // html renderers
    var HTML = {
        WordCloud: require('./html/renderer/WordCloud'),
        WordHistogram: require('./html/renderer/WordHistogram'),
        Heatmap: require('./html/renderer/Heatmap')
    };

    // webgl renderers
    var WebGL = {
        Heatmap: require('./webgl/renderer/Heatmap')
    };

    module.exports = {
        HTML: HTML,
        Canvas: Canvas,
        WebGL: WebGL
    };

}());
