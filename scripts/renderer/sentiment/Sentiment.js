(function() {

    'use strict';

    let POSITIVE = '1';
    let NEUTRAL = '0';
    let NEGATIVE = '-1';

    function getClassFunc(min, max) {
        min = min !== undefined ? min : -1;
        max = max !== undefined ? max : 1;
        let positive = [0.25 * max, 0.5 * max, 0.75 * max];
        let negative = [-0.25 * min, -0.5 * min, -0.75 * min];
        return function(sentiment) {
            let prefix;
            let range;
            if (sentiment < 0) {
                prefix = 'neg-';
                range = negative;
            } else {
                prefix = 'pos-';
                range = positive;
            }
            let abs = Math.abs(sentiment);
            if (abs > range[2]) {
                return prefix + '4';
            } else if (abs > range[1]) {
                return prefix + '3';
            } else if (abs > range[0]) {
                return prefix + '2';
            }
            return prefix + '1';
        };
    }

    function getTotal(count) {
        if (!count) {
            return 0;
        }
        let pos = count[POSITIVE] ? count[POSITIVE] : 0;
        let neu = count[NEUTRAL] ? count[NEUTRAL] : 0;
        let neg = count[NEGATIVE] ? count[NEGATIVE] : 0;
        return pos + neu + neg;
    }

    function getAvg(count) {
        if (!count) {
            return 0;
        }
        let pos = count[POSITIVE] ? count[POSITIVE] : 0;
        let neu = count[NEUTRAL] ? count[NEUTRAL] : 0;
        let neg = count[NEGATIVE] ? count[NEGATIVE] : 0;
        let total = pos + neu + neg;
        return (total !== 0) ? (pos - neg) / total : 0;
    }

    module.exports = {
        getClassFunc: getClassFunc,
        getTotal: getTotal,
        getAvg: getAvg
    };

}());
