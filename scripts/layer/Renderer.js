(function() {

    'use strict';

    // html renderers
    var WordCloud = require('./html/renderer/WordCloud');
    var WordHistogram = require('./html/renderer/WordHistogram');
    var Heatmap = require('./html/renderer/Heatmap');
    var HTML = {
        WordCloud: WordCloud,
        WordHistogram: WordHistogram,
        Heatmap: Heatmap
    };

    module.exports = {
        HTML: HTML
    };

}());
