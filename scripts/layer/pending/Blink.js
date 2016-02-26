(function() {

    'use strict';

    var $ = require('jquery');
    var Pending = require('../core/Pending');

    var Blink = Pending.extend({

        renderTile: function(elem) {
            $(elem).empty();
            $(elem).append('<div class="blinking blinking-tile" style="animation-delay:' + -(Math.random() * 1200) + 'ms;"></div>');
        }

    });

    module.exports = Blink;

}());
