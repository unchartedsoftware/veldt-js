(function() {

    'use strict';

    let DELAY = 1200;

    module.exports = {

        renderTile: function(elem) {
            setTimeout(() => {
                let delay = -(Math.random() * DELAY);
                if ($(elem).hasClass('pending')) {
                    elem.innerHTML = `<div class="blinking blinking-tile" style="animation-delay: ${delay}ms"></div>`;
                }
            }, DELAY);
        }

    };

}());
