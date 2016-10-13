(function() {

    'use strict';

    const DELAY = 1200;

    module.exports = {

        renderTile: function(elem) {
            setTimeout(() => {
                const delay = -(Math.random() * DELAY);
                if ($(elem).hasClass('pending')) {
                    elem.innerHTML = `<div class="blinking blinking-tile" style="animation-delay: ${delay}ms"></div>`;
                }
            }, DELAY);
        }

    };

}());
