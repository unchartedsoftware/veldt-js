(function() {

    'use strict';

    var Live = require('../core/Live');

    var Community = Live.extend({

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
