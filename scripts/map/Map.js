(function() {

    'use strict';

    let resetMouseCursorStyle = function() {
        // we only want this bound ONCE per map
        $(this._container).css('cursor', '');
    };

    let Map = L.Map.extend({

        initialize: function() {
            L.Map.prototype.initialize.apply(this, arguments);
            this.on('mousemove', resetMouseCursorStyle, this);
        }

    });

    module.exports = Map;

}());
