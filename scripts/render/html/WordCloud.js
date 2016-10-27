'use strict';

const _ = require('lodash');
const $ = require('jquery');
const lumo = require('lumo');
const Transform = require('../transform/Transform');

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

const getMouseButton = function(event) {
	if (event.which === 1) {
		return 'left';
	} else if (event.which === 2) {
		return 'middle';
	} else if (event.which === 3) {
		return 'right';
	}
};

class WordCloud extends lumo.HTMLRenderer {

	constructor(options = {}) {
		super(options);
		this.transform = _.defaultTo(options.transform, 'log10');
		this.maxNumWords = _.defaultTo(options.maxNumWords, 15);
		this.minFontSize = _.defaultTo(options.minFontSize, 10);
		this.maxFontSize = _.defaultTo(options.maxFontSize, 20);
	}

	onAdd(layer) {
		super.onAdd(layer);
		this.mouseover = event => {
			this.onMouseOver(event);
		};
		this.mouseout = event => {
			this.onMouseOut(event);
		};
		this.click = event => {
			this.onClick(event);
		};
		$(this.container).on('mouseover', this.mouseover);
		$(this.container).on('mouseout', this.mouseout);
		$(this.container).on('click', this.click);
	}

	onRemove(layer) {
		$(this.container).off('mouseover', this.mouseover);
		$(this.container).off('mouseout', this.mouseout);
		$(this.container).off('click', this.click);
		this.mouseover = null;
		this.mouseout = null;
		this.click = null;
		super.onRemove(layer);
	}

	clearSelection() {
		$(this.container).removeClass('highlight');
		this.highlight = null;
	}

	setHighlight(word) {
		this.clearSelection();
		// Highlight selected word
		$(this.container).addClass('highlight');
		$(`.word-cloud-label[data-word="${word}"]`).addClass('highlight');
		this.highlight = word;
	}

	onMouseOver(event) {
		$('.word-cloud-label').removeClass('hover');
		const word = $(event.target).attr('data-word');
		if (word) {
			// highlight all instances of the word
			$(`.word-cloud-label[data-word="${word}"]`).addClass('hover');
			// emit mouseover event
			const plot = this.layer.plot;
			this.emit(lumo.MOUSE_OVER, new lumo.MouseEvent(
				this.layer,
				getMouseButton(event),
				plot.mouseToViewPx(),
				plot.mouseToPlotPx(),
				word
			));
		}
	}

	onMouseOut(event) {
		$('.word-cloud-label').removeClass('hover');
		const word = $(event.target).attr('data-word');
		if (word) {
			// emit click event
			const plot = this.layer.plot;
			this.emit(lumo.MOUSE_OUT, new lumo.MouseEvent(
				this.layer,
				getMouseButton(event),
				plot.mouseToViewPx(),
				plot.mouseToPlotPx(),
				word
			));
		}
	}

	onClick(event) {
		// un-select any prev selected words
		$('.word-cloud-label').removeClass('highlight');
		$(this.container).removeClass('highlight');
		const word = $(event.target).attr('data-word');
		if (word) {
			// set highlight
			this.setHighlight(word);
			// emit click event
			const plot = this.layer.plot;
			this.emit(lumo.CLICK, new lumo.ClickEvent(
				this.layer,
				getMouseButton(event),
				plot.mouseToViewPx(),
				plot.mouseToPlotPx(),
				word));
		} else {
			this.clearSelection();
		}
	}

	_measureWords(wordCounts) {
		// sort words by frequency
		wordCounts = wordCounts.sort((a, b) => {
			return b.count - a.count;
		}).slice(0, this.maxNumWords);
		// build measurement html
		const $html = $('<div style="height:256px; width:256px;"></div>');
		const minFontSize = this.minFontSize;
		const maxFontSize = this.maxFontSize;
		wordCounts.forEach(word => {
			word.percent = Transform.transform(word.count, this.transform, this.getExtrema());
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
	}

	_createWordCloud(wordCounts) {
		const tileSize = this.layer.plot.tileSize;
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
						text: wordCount.text,
						fontSize: wordCount.fontSize,
						percent: Math.round((wordCount.percent * 100) / 10) * 10, // round to nearest 10
						x: pos.x,
						y: pos.y,
						width: wordCount.width,
						height: wordCount.height
					});
					break;
				}
			}
		});
		return cloud;
	}

	drawTile(element, tile) {
		if (_.isEmpty(tile.data)) {
			return;
		}
		const wordCounts = _.map(tile.data, (count, text) => {
			return {
				text: text,
				count: count
			};
		});
		// genereate the cloud
		const cloud = this._createWordCloud(wordCounts);
		// half tile size
		const halfSize = this.layer.plot.tileSize / 2;
		// create html for tile
		let html = $();
		cloud.forEach(function(word) {
			// create element for word
			const div = $(
				`
				<div class="
					word-cloud-label
					word-cloud-label-${word.percent}
					${word.text === this.highlight ? 'highlight' : ''}"
					style="
						font-size: ${word.fontSize}px;
						left: ${(halfSize + word.x) - (word.width / 2)}px;
						top: ${(halfSize + word.y) - (word.height / 2)}px;
						width: ${word.width}px;
						height: ${word.height}px;"
					data-word="${word.key}">${word.text}</div>
				`);
			html = html.add(div);
		});
		$(element).empty().append(html);
	}
}

module.exports = WordCloud;
