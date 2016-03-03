(function() {

    'use strict';

    module.exports = {

        renderTile: function(elem) {
            elem.innerHtml = '<div class="blinking blinking-tile" style="animation-delay:' + -(Math.random() * 1200) + 'ms;"></div>';
        }

    };

}());
