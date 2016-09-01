(function() {

    'use strict';

    let HTML = require('../../core/HTML');
    let ValueTransform = require('../../mixin/ValueTransform');
    let sentiment = require('../../sentiment/Sentiment');
    let sentimentFunc = sentiment.getClassFunc(-1, 1);

    let isSingleValue = function(count) {
        // single values are never null, and always numbers
        return count !== null && _.isNumber(count);
    };

    let extractCount = function(count) {
        if (isSingleValue(count)) {
            return count;
        }
        return sentiment.getTotal(count);
    };

    let extractSentimentClass = function(avg) {
        if (avg !== undefined) {
            return sentimentFunc(avg);
        }
        return '';
    };

    let extractFrequency = function(count) {
        if (isSingleValue(count)) {
            return {
                count: count
            };
        }
        return {
            count: sentiment.getTotal(count),
            avg: sentiment.getAvg(count)
        };
    };

    let extractAvg = function(frequencies) {
        if (frequencies[0].avg === undefined) {
            return;
        }
        let sum = _.sumBy(frequencies, function(frequency) {
            return frequency.avg;
        });
        return sum / frequencies.length;
    };

    let extractValues = function(data, key) {
        let frequencies = _.map(data, extractFrequency);
        let avg = extractAvg(frequencies);
        let max = _.maxBy(frequencies, val => {
            return val.count;
        }).count;
        let total = _.sumBy(frequencies, val => {
            return val.count;
        });
        return {
            topic: key,
            frequencies: frequencies,
            max: max,
            total: total,
            avg: avg
        };
    };

    let WordHistogram = HTML.extend({

        includes: [
            // mixins
            ValueTransform
        ],

        options: {
            maxNumWords: 8,
            minFontSize: 16,
            maxFontSize: 22
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
            $(`.word-histogram-entry[data-word="${word}"]`).addClass('highlight');
            this.highlight = word;
        },

        onMouseOver: function(e) {
            let target = $(e.originalEvent.target);
            $('.word-histogram-entry').removeClass('hover');
            let word = target.attr('data-word');
            if (word) {
                $(`.word-histogram-entry[data-word="${word}"]`).addClass('hover');
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
                        type: 'word-histogram',
                        layer: this
                    });
                }
            }
        },

        onMouseOut: function(e) {
            let target = $(e.originalEvent.target);
            $('.word-histogram-entry').removeClass('hover');
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
                        type: 'word-histogram',
                        layer: this
                    });
                }
            }
        },

        onClick: function(e) {
            // un-select and prev selected histogram
            $('.word-histogram-entry').removeClass('highlight');
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
                    this.fire('mouseover', {
                        elem: e.originalEvent.target,
                        value: word,
                        x: coord.x,
                        y: coord.y,
                        z: coord.z,
                        data: cached.data,
                        type: 'word-histogram',
                        layer: this
                    });
                }
            } else {
                this.clearSelection();
            }
        },

        extractExtrema: function(data) {
            let sums = _.map(data, counts => {
                return _.sumBy(counts, extractCount);
            });
            return {
                min: _.min(sums),
                max: _.max(sums),
            };
        },

        renderTile: function(container, data) {
            if (!data || _.isEmpty(data)) {
                return;
            }
            let highlight = this.highlight;
            // convert object to array
            let values = _.map(data, extractValues).sort((a, b) => {
                return b.total - a.total;
            });
            // get number of entries
            let numEntries = Math.min(values.length, this.options.maxNumWords);
            let $html = $('<div class="word-histograms" style="display:inline-block;"></div>');
            let totalHeight = 0;
            let minFontSize = this.options.minFontSize;
            let maxFontSize = this.options.maxFontSize;
            values.slice(0, numEntries).forEach(value => {
                let topic = value.topic;
                let frequencies = value.frequencies;
                let max = value.max;
                let total = value.total;
                let avg = value.avg;
                let sentimentClass = extractSentimentClass(avg);
                let highlightClass = (topic === highlight) ? 'highlight' : '';
                // scale the height based on level min / max
                let percent = this.transformValue(total);
                let percentLabel = Math.round((percent * 100) / 10) * 10;
                let height = minFontSize + percent * (maxFontSize - minFontSize);
                totalHeight += height;
                // create container 'entry' for chart and hashtag
                let $entry = $(
                    `
                    <div class="word-histogram-entry ${highlightClass}"
                        data-sentiment="${avg}"
                        data-word="${topic}"
                        style="height:${height}px;">
                    </div>
                    `);
                // create chart
                let $chart = $(
                    `
                    <div class="word-histogram-left"
                        data-sentiment="${avg}"
                        data-word="${topic}">
                    </div>
                    `);
                let barWidth = 'calc(' + (100 / frequencies.length) + '%)';
                // create bars
                frequencies.forEach(frequency => {
                    let count = frequency.count;
                    let avg = frequency.avg;
                    let sentimentClass = extractSentimentClass(avg);
                    // get the percent relative to the highest count in the tile
                    let relativePercent = (max !== 0) ? (count / max) * 100 : 0;
                    // make invisible if zero count
                    let visibility = relativePercent === 0 ? 'hidden' : '';
                    // Get the style class of the bar
                    let percentLabel = Math.round(relativePercent / 10) * 10;
                    let barClasses = [
                            'word-histogram-bar',
                            `word-histogram-bar-${percentLabel}`,
                            `${sentimentClass}-fill`
                        ].join(' ');
                    let barHeight;
                    let barTop;
                    // ensure there is at least a single pixel of color
                    if ((relativePercent / 100) * height < 3) {
                        barHeight = '3px';
                        barTop = 'calc(100% - 3px)';
                    } else {
                        barHeight = `${relativePercent}%`;
                        barTop = `(100 - relativePercent)%`;
                    }
                    // create bar
                    $chart.append(
                        `
                        <div class="${barClasses}"
                            data-word="${topic}"
                            style="
                            visibility: ${visibility};
                            width: ${barWidth};
                            height: ${barHeight};
                            top: ${barTop};">
                        </div>
                        `);
                });
                $entry.append($chart);
                let topicClasses = [
                    'word-histogram-label',
                    `word-histogram-label-${percentLabel}`,
                    sentimentClass
                ].join(' ');
                // create tag label
                let $topic = $(
                    `
                    <div class="word-histogram-right">
                        <div class="${topicClasses}"
                            data-sentiment="${avg}"
                            data-word="${topic}"
                        style="
                            font-size: ${height}px;
                            line-height: ${height}px;
                            height: ${height}px;">${topic}</div>
                    </div>
                    `);
                $entry.append($topic);
                $html.append($entry);
            });
            $html.css('top', (this.options.tileSize / 2) - (totalHeight / 2));
            container.innerHTML = $html[0].outerHTML;
        }
    });

    module.exports = WordHistogram;

}());
