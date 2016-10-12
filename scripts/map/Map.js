(function() {

    'use strict';

    const resetMouseCursorStyle = function() {
        // we only want this bound ONCE per map
        $(this._container).css('cursor', '');
    };

    const Map = L.Map.extend({

        initialize: function() {
            L.Map.prototype.initialize.apply(this, arguments);
            this.on('mousemove', resetMouseCursorStyle, this);
        }

    });

    module.exports = Map;

}());
