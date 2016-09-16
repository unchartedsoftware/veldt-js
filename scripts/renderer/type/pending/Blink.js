(function() {

    'use strict';

    let DELAY = 1200;

    module.exports = {

        renderTile: function(elem) {
            let delay = -(Math.random() * DELAY);
            elem.innerHTML = `<div class="blinking blinking-tile" style="animation-delay:${delay}ms"></div>`;
        }

    };

}());
