(function() {

    'use strict';

    let Live = require('../core/Live');

    let Community = Live.extend({

        type: 'community',

        extractExtrema: function() {
            return {
                min: Infinity,
                max: -Infinity
            };
        }
    });

    module.exports = Community;

}());
