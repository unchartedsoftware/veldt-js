(function() {

    'use strict';

    const HTML = require('../../core/HTML');
    const ValueTransform = require('../../mixin/ValueTransform');
    const sentiment = require('../../sentiment/Sentiment');
    const sentimentFunc = sentiment.getClassFunc(-1, 1);

    const VERTICAL_OFFSET = 24;
    const HORIZONTAL_OFFSET = 10;
    const NUM_ATTEMPTS = 1;

    /**
     * Given an initial position, return a new position, incrementally spiralled
     * outwards.
     */
    const spiralPosition = function(pos) {
        const pi2 = 2 * Math.PI;
        const circ = pi2 * pos.radius;
        const inc = (pos.arcLength > circ / 10) ? circ / 10 : pos.arcLength;
        const da = inc / pos.radius;
        let nt = (pos.t + da);
        if (nt > pi2) {
            nt = nt % pi2;
            pos.radius = pos.radius + pos.radiusInc;
        }
        pos.t = nt;
        pos.x = pos.radius * Math.cos(nt);
        pos.y = pos.radius * Math.sin(nt);
        return pos;
    };

    /**
     *  Returns true if bounding box a intersects bounding box b
     */
    const intersectTest = function(a, b) {
        return (Math.abs(a.x - b.x) * 2 < (a.width + b.width)) &&
            (Math.abs(a.y - b.y) * 2 < (a.height + b.height));
    };

    /**
     *  Returns true if bounding box a is not fully contained inside bounding box b
     */
    const overlapTest = function(a, b) {
        return (a.x + a.width / 2 > b.x + b.width / 2 ||
            a.x - a.width / 2 < b.x - b.width / 2 ||
            a.y + a.height / 2 > b.y + b.height / 2 ||
            a.y - a.height / 2 < b.y - b.height / 2);
    };

    /**
     * Check if a word intersects another word, or is not fully contained in the
     * tile bounding box
     */
    const intersectWord = function(position, word, cloud, bb) {
        const box = {
            x: position.x,
            y: position.y,
            height: word.height,
            width: word.width
        };
        for (let i = 0; i < cloud.length; i++) {
            if (intersectTest(box, cloud[i])) {
                return true;
            }
        }
        // make sure it doesn't intersect the border;
        if (overlapTest(box, bb)) {
            // if it hits a border, increment collision count
            // and extend arc length
            position.collisions++;
            position.arcLength = position.radius;
            return true;
        }
        return false;
    };

    const WordCloud = HTML.extend({

        includes: [
            // mixins
            ValueTransform
        ],

        options: {
            maxNumWords: 15,
            minFontSize: 10,
            maxFontSize: 20
        },

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
        },

        clearSelection: function() {
            $(this._container).removeClass('highlight');
            this.highlight = null;
        },

        setHighlight: function(word) {
            this.clearSelection();
            // Highlight selected word
            $(this._container).addClass('highlight');
            $(`.word-cloud-label[data-word="${word}"]`).addClass('highlight');
            this.highlight = word;
        },

        onMouseOver: function(e) {
            const target = $(e.originalEvent.target);
            $('.word-cloud-label').removeClass('hover');
            const word = target.attr('data-word');
            if (word) {
                // highlight all instances of the word
                $(`.word-cloud-label[data-word="${word}"]`).addClass('hover');
                // get layer coord
                const layerPoint = this.getLayerPointFromEvent(e.originalEvent);
                // get tile coord
                const coord = this.getTileCoordFromLayerPoint(layerPoint);
                // get cache key
                const nkey = this.cacheKeyFromCoord(coord, true);
                // get cache entry
                const cached = this._cache[nkey];
                if (cached && cached.data) {
                    this.fire('mouseover', {
                        elem: e.originalEvent.target,
                        value: word,
                        x: coord.x,
                        y: coord.y,
                        z: coord.z,
                        data: cached.data,
                        type: 'word-cloud',
                        layer: this
                    });
                }
            }
        },

        onMouseOut: function(e) {
            const target = $(e.originalEvent.target);
            $('.word-cloud-label').removeClass('hover');
            const word = target.attr('data-word');
            if (word) {
                // get layer coord
                const layerPoint = this.getLayerPointFromEvent(e.originalEvent);
                // get tile coord
                const coord = this.getTileCoordFromLayerPoint(layerPoint);
                // get cache key
                const nkey = this.cacheKeyFromCoord(coord, true);
                // get cache entry
                const cached = this._cache[nkey];
                if (cached && cached.data) {
                    this.fire('mouseout', {
                        elem: e.originalEvent.target,
                        value: word,
                        x: coord.x,
                        y: coord.y,
                        z: coord.z,
                        data: cached.data,
                        type: 'word-cloud',
                        layer: this
                    });
                }
            }
        },

        onClick: function(e) {
            // un-select any prev selected words
            $('.word-cloud-label').removeClass('highlight');
            $(this._container).removeClass('highlight');
            // get target
            const target = $(e.originalEvent.target);
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            const word = target.attr('data-word');
            if (word) {
                this.setHighlight(word);
                // get layer coord
                const layerPoint = this.getLayerPointFromEvent(e.originalEvent);
                // get tile coord
                const coord = this.getTileCoordFromLayerPoint(layerPoint);
                // get cache key
                const nkey = this.cacheKeyFromCoord(coord, true);
                // get cache entry
                const cached = this._cache[nkey];
                if (cached && cached.data) {
                    this.fire('click', {
                        elem: e.originalEvent.target,
                        value: word,
                        x: coord.x,
                        y: coord.y,
                        z: coord.z,
                        data: cached.data,
                        type: 'word-cloud',
                        layer: this
                    });
                }
            } else {
                this.clearSelection();
            }
        },

        _measureWords: function(wordCounts) {
            // sort words by frequency
            wordCounts = wordCounts.sort((a, b) => {
                return b.count - a.count;
            }).slice(0, this.options.maxNumWords);
            // build measurement html
            const $html = $('<div style="height:256px; width:256px;"></div>');
            const minFontSize = this.options.minFontSize;
            const maxFontSize = this.options.maxFontSize;
            wordCounts.forEach(word => {
                word.percent = this.transformValue(word.count);
                word.fontSize = minFontSize + word.percent * (maxFontSize - minFontSize);
                $html.append(
                    `
                    <div class="word-cloud-label" style="
                        visibility:hidden;
                        font-size: ${word.fontSize}px;">${word.text}</div>;
                    `);
            });
            // append measurements
            $('body').append($html);
            $html.children().each((index, elem) => {
                wordCounts[index].width = elem.offsetWidth;
                wordCounts[index].height = elem.offsetHeight;
            });
            $html.remove();
            return wordCounts;
        },

        _createWordCloud: function(wordCounts) {
            const tileSize = this.options.tileSize;
            const boundingBox = {
                width: tileSize - HORIZONTAL_OFFSET * 2,
                height: tileSize - VERTICAL_OFFSET * 2,
                x: 0,
                y: 0
            };
            const cloud = [];
            // sort words by frequency
            wordCounts = this._measureWords(wordCounts);
            // assemble word cloud
            wordCounts.forEach(wordCount => {
                // starting spiral position
                let pos = {
                    radius: 1,
                    radiusInc: 5,
                    arcLength: 10,
                    x: 0,
                    y: 0,
                    t: 0,
                    collisions: 0
                };
                // spiral outwards to find position
                while (pos.collisions < NUM_ATTEMPTS) {
                    // increment position in a spiral
                    pos = spiralPosition(pos);
                    // test for intersection
                    if (!intersectWord(pos, wordCount, cloud, boundingBox)) {
                        cloud.push({
                            key: wordCount.key,
                            text: wordCount.text,
                            fontSize: wordCount.fontSize,
                            percent: Math.round((wordCount.percent * 100) / 10) * 10, // round to nearest 10
                            x: pos.x,
                            y: pos.y,
                            width: wordCount.width,
                            height: wordCount.height,
                            sentiment: wordCount.sentiment,
                            avg: wordCount.avg
                        });
                        break;
                    }
                }
            });
            return cloud;
        },

        extractExtrema: function(data) {
            const sums = _.map(data, function(count) {
                count = count.counts || count;
                if (_.isNumber(count)) {
                    return count;
                }
                return sentiment.getTotal(count);
            });
            return {
                min: _.min(sums),
                max: _.max(sums),
            };
        },

        getText: function(keyData, key) {
            return key;
        },

        renderTile: function(container, data) {
            if (!data || _.isEmpty(data)) {
                return;
            }
            const highlight = this.highlight;
            const wordCounts = _.map(data, (keyData, key) => {
                const count = keyData.counts || keyData;
                const text = this.getText(keyData, key);
                if (_.isNumber(count)) {
                    return {
                        key: key,
                        text: text,
                        count: count
                    };
                }
                const total = sentiment.getTotal(count);
                const avg = sentiment.getAvg(count);
                return {
                    key: key,
                    text: text,
                    count: total,
                    avg: avg,
                    sentiment: sentimentFunc(avg)
                };
            });
            // exit early if no words
            if (wordCounts.length === 0) {
                return;
            }
            // genereate the cloud
            const cloud = this._createWordCloud(wordCounts);
            // build html elements
            const halfSize = this.options.tileSize / 2;
            let html = '';
            cloud.forEach(function(word) {
                // create classes
                const classNames = [
                        'word-cloud-label',
                        `word-cloud-label-${word.percent}`,
                        word.text === highlight ? 'highlight' : '',
                        word.sentiment ? word.sentiment : ''
                    ].join(' ');
                // create styles
                const styles = [
                        `font-size: ${word.fontSize}px`,
                        `left: ${(halfSize + word.x) - (word.width / 2)}px`,
                        `top: ${(halfSize + word.y) - (word.height / 2)}px`,
                        `width: ${word.width}px`,
                        `height: ${word.height}px`,
                    ].join(';');
                // create html for entry
                html +=
                    `
                    <div class="${classNames}"
                        style="${styles}"
                        data-sentiment="${word.avg}"
                        data-word="${word.key}">${word.text}</div>
                    `;
            });
            container.innerHTML = html;
        }

    });

    module.exports = WordCloud;

}());
