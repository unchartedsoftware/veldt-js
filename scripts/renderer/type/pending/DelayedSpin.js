(function() {

    'use strict';

    const DELAY = 1200;

    module.exports = {

        renderTile: function(elem) {
            setTimeout(() => {
                const delay = -(Math.random() * DELAY);
                if ($(elem).hasClass('pending')) {
                    elem.innerHTML =
                        `
                        <div class="vertical-centered-box" style="animation-delay: ${delay}ms">
                            <div class="content">
                                <div class="loader-circle"></div>
                                <div class="loader-line-mask" style="animation-delay: ${delay}ms">
                                    <div class="loader-line"></div>
                                </div>
                            </div>
                        </div>
                        `;
                }
            }, DELAY);
        }

    };

}());
