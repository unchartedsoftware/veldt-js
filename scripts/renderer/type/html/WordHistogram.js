(function() {

    'use strict';

    const HTML = require('../../core/HTML');
    const ValueTransform = require('../../mixin/ValueTransform');
    const sentiment = require('../../sentiment/Sentiment');
    const sentimentFunc = sentiment.getClassFunc(-1, 1);

    const isSingleValue = function(count) {
        // single values are never null, and always numbers
        return count !== null && _.isNumber(count);
    };

    const extractCount = function(count) {
        if (isSingleValue(count)) {
            return count;
        }
        return sentiment.getTotal(count);
    };

    const extractSentimentClass = function(avg) {
        if (avg !== undefined) {
            return sentimentFunc(avg);
        }
        return '';
    };

    const extractFrequency = function(count) {
        count = count.counts || count;
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

    const extractAvg = function(frequencies) {
        if (frequencies[0].avg === undefined) {
            return;
        }
        const sum = _.sumBy(frequencies, function(frequency) {
            return frequency.avg;
        });
        return sum / frequencies.length;
    };

    const WordHistogram = HTML.extend({

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
            const target = $(e.originalEvent.target);
            $('.word-histogram-entry').removeClass('hover');
            const word = target.attr('data-word');
            if (word) {
                $(`.word-histogram-entry[data-word="${word}"]`).addClass('hover');
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
                        type: 'word-histogram',
                        layer: this
                    });
                }
            }
        },

        onMouseOut: function(e) {
            const target = $(e.originalEvent.target);
            $('.word-histogram-entry').removeClass('hover');
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
                        type: 'word-histogram',
                        layer: this
                    });
                }
            } else {
                this.clearSelection();
            }
        },

        extractExtrema: function(data) {
            const sums = _.map(data, counts => {
                return _.sumBy(counts, extractCount);
            });
            return {
                min: _.min(sums),
                max: _.max(sums),
            };
        },

        getText: function(keyData, key) {
            return key;
        },

        extractValues: function(data, key) {
            const frequencies = _.map(data, extractFrequency);
            const avg = extractAvg(frequencies);
            const max = _.maxBy(frequencies, function(val) {
                return val.count;
            }).count;
            const total = _.sumBy(frequencies, function(val) {
                return val.count;
            });
            return {
                key: key,
                topic: this.getText(data, key),
                frequencies: frequencies,
                max: max,
                total: total,
                avg: avg
            };
        },

        renderTile: function(container, data) {
            if (!data || _.isEmpty(data)) {
                return;
            }
            const highlight = this.highlight;
            // convert object to array
            const values = _.map(data, this.extractValues.bind(this)).sort((a, b) => {
                return b.total - a.total;
            });
            // get number of entries
            const numEntries = Math.min(values.length, this.options.maxNumWords);
            const $html = $('<div class="word-histograms" style="display:inline-block;"></div>');
            let totalHeight = 0;
            const minFontSize = this.options.minFontSize;
            const maxFontSize = this.options.maxFontSize;
            values.slice(0, numEntries).forEach(value => {
                const key = value.key;
                const topic = value.topic;
                const frequencies = value.frequencies;
                const max = value.max;
                const total = value.total;
                const avg = value.avg;
                const sentimentClass = extractSentimentClass(avg);
                const highlightClass = (key === highlight) ? 'highlight' : '';
                // scale the height based on level min / max
                const percent = this.transformValue(total);
                const percentLabel = Math.round((percent * 100) / 10) * 10;
                const height = minFontSize + percent * (maxFontSize - minFontSize);
                totalHeight += height;
                // create container 'entry' for chart and hashtag
                const $entry = $(
                    `
                    <div class="word-histogram-entry ${highlightClass}"
                        data-sentiment="${avg}"
                        data-word="${key}"
                        style="height:${height}px;">
                    </div>
                    `);
                // create chart
                const $chart = $(
                    `
                    <div class="word-histogram-left"
                        data-sentiment="${avg}"
                        data-word="${key}">
                    </div>
                    `);
                const barWidth = 'calc(' + (100 / frequencies.length) + '%)';
                // create bars
                frequencies.forEach(frequency => {
                    const count = frequency.count;
                    const avg = frequency.avg;
                    const sentimentClass = extractSentimentClass(avg);
                    // get the percent relative to the highest count in the tile
                    const relativePercent = (max !== 0) ? (count / max) * 100 : 0;
                    // make invisible if zero count
                    const visibility = relativePercent === 0 ? 'hidden' : 'visible';
                    // Get the style class of the bar
                    const percentLabel = Math.round(relativePercent / 10) * 10;
                    const barClasses = [
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
                        barTop = `${100 - relativePercent}%`;
                    }
                    // create bar
                    $chart.append(
                        `
                        <div class="${barClasses}"
                            data-word="${key}"
                            style="
                            visibility: ${visibility};
                            width: ${barWidth};
                            height: ${barHeight};
                            top: ${barTop};">
                        </div>
                        `);
                });
                $entry.append($chart);
                const topicClasses = [
                    'word-histogram-label',
                    `word-histogram-label-${percentLabel}`,
                    sentimentClass
                ].join(' ');
                // create tag label
                const $topic = $(
                    `
                    <div class="word-histogram-right">
                        <div class="${topicClasses}"
                            data-sentiment="${avg}"
                            data-word="${key}"
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
