(function() {

    'use strict';

    var DELAY = 1200 / 2;

    module.exports = {

        renderTile: function(elem) {
            setTimeout(
                function() {
                    if ($(elem).hasClass('pending')) {
                        elem.innerHTML =
                            '<div class="vertical-centered-box">' +
                                '<div class="content">' +
                                    '<div class="loader-circle"></div>' +
                                    '<div class="loader-line-mask">' +
                                        '<div class="loader-line"></div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>';
                    }
                },
                DELAY);
        }

    };

}());
