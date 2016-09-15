(function() {

    'use strict';

    let HTML = require('../../core/HTML');
    let ValueTransform = require('../../mixin/ValueTransform');
    let sentiment = require('../../sentiment/Sentiment');
    let sentimentFunc = sentiment.getClassFunc(-1, 1);

    let VERTICAL_OFFSET = 24;
    let HORIZONTAL_OFFSET = 10;
    let NUM_ATTEMPTS = 1;

    /**
     * Given an initial position, return a new position, incrementally spiralled
     * outwards.
     */
    let spiralPosition = function(pos) {
        let pi2 = 2 * Math.PI;
        let circ = pi2 * pos.radius;
        let inc = (pos.arcLength > circ / 10) ? circ / 10 : pos.arcLength;
        let da = inc / pos.radius;
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
    let intersectTest = function(a, b) {
        return (Math.abs(a.x - b.x) * 2 < (a.width + b.width)) &&
            (Math.abs(a.y - b.y) * 2 < (a.height + b.height));
    };

    /**
     *  Returns true if bounding box a is not fully contained inside bounding box b
     */
    let overlapTest = function(a, b) {
        return (a.x + a.width / 2 > b.x + b.width / 2 ||
            a.x - a.width / 2 < b.x - b.width / 2 ||
            a.y + a.height / 2 > b.y + b.height / 2 ||
            a.y - a.height / 2 < b.y - b.height / 2);
    };

    /**
     * Check if a word intersects another word, or is not fully contained in the
     * tile bounding box
     */
    let intersectWord = function(position, word, cloud, bb) {
        let box = {
            x: position.x,
            y: position.y,
            height: word.height,
            width: word.width
        };
        let i;
        for (i = 0; i < cloud.length; i++) {
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

    let WordCloud = HTML.extend({

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
            let target = $(e.originalEvent.target);
            $('.word-cloud-label').removeClass('hover');
            let word = target.attr('data-word');
            if (word) {
                // highlight all instances of the word
                $(`.word-cloud-label[data-word="${word}"]`).addClass('hover');
                // get layer coord
                let layerPoint = this.getLayerPointFromEvent(e.originalEvent);
                // get tile coord
                let coord = this.getTileCoordFromLayerPoint(layerPoint);
                // get cache key
                let nkey = this.cacheKeyFromCoord(coord, true);
                // get cache entry
                let cached = this._cache[nkey];
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
            let target = $(e.originalEvent.target);
            $('.word-cloud-label').removeClass('hover');
            let word = target.attr('data-word');
            if (word) {
                // get layer coord
                let layerPoint = this.getLayerPointFromEvent(e.originalEvent);
                // get tile coord
                let coord = this.getTileCoordFromLayerPoint(layerPoint);
                // get cache key
                let nkey = this.cacheKeyFromCoord(coord, true);
                // get cache entry
                let cached = this._cache[nkey];
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
            let target = $(e.originalEvent.target);
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            let word = target.attr('data-word');
            if (word) {
                this.setHighlight(word);
                // get layer coord
                let layerPoint = this.getLayerPointFromEvent(e.originalEvent);
                // get tile coord
                let coord = this.getTileCoordFromLayerPoint(layerPoint);
                // get cache key
                let nkey = this.cacheKeyFromCoord(coord, true);
                // get cache entry
                let cached = this._cache[nkey];
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
            let $html = $('<div style="height:256px; width:256px;"></div>');
            let minFontSize = this.options.minFontSize;
            let maxFontSize = this.options.maxFontSize;
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
            let tileSize = this.options.tileSize;
            let boundingBox = {
                width: tileSize - HORIZONTAL_OFFSET * 2,
                height: tileSize - VERTICAL_OFFSET * 2,
                x: 0,
                y: 0
            };
            let cloud = [];
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
            let sums = _.map(data, function(count) {
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
            let highlight = this.highlight;
            let wordCounts = _.map(data, (keyData, key) => {
                let count = keyData.counts || keyData;
                let text = this.getText(keyData, key);
                if (_.isNumber(count)) {
                    return {
                        key: key,
                        text: text,
                        count: count
                    };
                }
                let total = sentiment.getTotal(count);
                let avg = sentiment.getAvg(count);
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
            let cloud = this._createWordCloud(wordCounts);
            // build html elements
            let halfSize = this.options.tileSize / 2;
            let html = '';
            cloud.forEach(function(word) {
                // create classes
                let classNames = [
                        'word-cloud-label',
                        `word-cloud-label-${word.percent}`,
                        word.text === highlight ? 'highlight' : '',
                        word.sentiment ? word.sentiment : ''
                    ].join(' ');
                // create styles
                let styles = [
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
