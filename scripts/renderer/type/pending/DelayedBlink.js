(function() {

    'use strict';

    var DELAY = 1200 / 2;

    module.exports = {

        renderTile: function(elem) {
            setTimeout(
                function() {
                    if ($(elem).hasClass('pending')) {
                        elem.innerHTML = '<div class="blinking blinking-tile"></div>';
                    }
                },
                DELAY);
        }

    };

}());
