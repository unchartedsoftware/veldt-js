(function() {

    'use strict';

    const POSITIVE = '1';
    const NEUTRAL = '0';
    const NEGATIVE = '-1';

    function getClassFunc(min, max) {
        min = min !== undefined ? min : -1;
        max = max !== undefined ? max : 1;
        const positive = [0.25 * max, 0.5 * max, 0.75 * max];
        const negative = [-0.25 * min, -0.5 * min, -0.75 * min];
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
            const abs = Math.abs(sentiment);
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
        const pos = count[POSITIVE] ? count[POSITIVE] : 0;
        const neu = count[NEUTRAL] ? count[NEUTRAL] : 0;
        const neg = count[NEGATIVE] ? count[NEGATIVE] : 0;
        return pos + neu + neg;
    }

    function getAvg(count) {
        if (!count) {
            return 0;
        }
        const pos = count[POSITIVE] ? count[POSITIVE] : 0;
        const neu = count[NEUTRAL] ? count[NEUTRAL] : 0;
        const neg = count[NEGATIVE] ? count[NEGATIVE] : 0;
        const total = pos + neu + neg;
        return (total !== 0) ? (pos - neg) / total : 0;
    }

    module.exports = {
        getClassFunc: getClassFunc,
        getTotal: getTotal,
        getAvg: getAvg
    };

}());
