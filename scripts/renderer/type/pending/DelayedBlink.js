(function() {

    'use strict';

    var DELAY = 1200;

    module.exports = {

        renderTile: function(elem) {
            setTimeout(
                function() {
                    var delay = -(Math.random() * DELAY) + 'ms';
                    if ($(elem).hasClass('pending')) {
                        elem.innerHTML = '<div class="blinking blinking-tile" style="animation-delay:' + delay + '"></div>';
                    }
                },
                DELAY);
        }

    };

}());
