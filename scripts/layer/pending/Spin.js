(function() {

    'use strict';

    var Pending = require('../core/Pending');

    var Spin = Pending.extend({

        renderTile: function(elem) {
            var delay = -(Math.random() * 1200) + 'ms';
            elem.innerHTML = '<div class="vertical-centered-box blinking" style="animation-delay:' + delay + '">' +
                '<div class="content">' +
                '<div class="loader-circle"></div>' +
                '<div class="loader-line-mask" style="animation-delay:' + delay + '">' +
                '<div class="loader-line"></div>' +
                '</div>' +
                '</div>' +
                '</div>';
        }

    });

    module.exports = Spin;

}());
