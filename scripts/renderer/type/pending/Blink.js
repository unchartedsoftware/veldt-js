(function() {

    'use strict';

    const DELAY = 1200;

    module.exports = {

        renderTile: function(elem) {
            const delay = -(Math.random() * DELAY);
            elem.innerHTML = `<div class="blinking blinking-tile" style="animation-delay:${delay}ms"></div>`;
        }

    };

}());
