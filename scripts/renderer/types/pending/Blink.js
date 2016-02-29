(function() {

    'use strict';

    var $ = require('jquery');
    
    module.exports = {

        renderTile: function(elem) {
            $(elem).empty();
            $(elem).append('<div class="blinking blinking-tile" style="animation-delay:' + -(Math.random() * 1200) + 'ms;"></div>');
        }

    };

}());
