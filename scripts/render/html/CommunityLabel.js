'use strict';

const $ = require('jquery');
const lumo = require('lumo');
const get = require('lodash/get');
const defaultTo = require('lodash/defaultTo');
const HTMLRenderer = require('../dom/HTMLRenderer');
const EventType = require('../event/EventType');
const Transform = require('../transform/Transform');

const HEIGHT_BUFFER = 4;
const MEASURE_CANVAS = document.createElement('canvas');
const PICK = Symbol();
const MOUSE_OVER = Symbol();
const MOUSE_OUT = Symbol();
const CLICK = Symbol();
const DECONFLICT = Symbol();

const getTextWidth = function(text, fontSize, fontFamily, buffer) {
	const font = `${fontSize}pt ${fontFamily}`;
	const context = MEASURE_CANVAS.getContext('2');
	context.font = font;
	var metrics = context.measureText(text);
	return Math.floor(metrics.width) + 1 + buffer;
};

class CommunityLabel extends HTMLRenderer {

	constructor(options = {}) {
		super(options);
		this.transform = defaultTo(options.transform, 'log10');
		this.minFontSize = defaultTo(options.minFontSize, 10);
		this.maxFontSize = defaultTo(options.maxFontSize, 24);
		this.fontFamily = defaultTo(options.fontFamily, 'ariel');
		this.minOpacity = defaultTo(options.minOpacity, 0.6);
		this.maxOpacity = defaultTo(options.maxOpacity, 1.0);
		this.labelMaxLength = defaultTo(options.labelMaxLength, 256);
		this.labelThreshold = defaultTo(options.labelThreshold, 0.6);
		this.labelField = defaultTo(options.labelField, 'metadata');
		this.labelDeconflict = defaultTo(options.labelDeconflict, true);
		this[PICK] = null;
		this[MOUSE_OVER] = null;
		this[MOUSE_OUT] = null;
		this[DECONFLICT] = null;
	}

	onAdd(layer) {
		super.onAdd(layer);
		this[MOUSE_OVER] = event => {
			const data = $(event.target).data('community');
			if (data) {
				this[PICK] = data;
			}
		};
		this[MOUSE_OUT] = () => {
			this[PICK] = null;
		};
		this[MOUSE_OVER] = event => {
			this.onMouseOver(event);
		};
		this[MOUSE_OUT] = event => {
			this.onMouseOut(event);
		};
		this[CLICK] = event => {
			this.onClick(event);
		};
		if (this.labelDeconflict) {
			this[DECONFLICT] = () => {
				const tree = new lumo.RTree({
					collisionType: lumo.RECTANGLE,
					nodeCapacity: 64
				});
				// grab all labels
				const $labels = $(this.container).find('.community-label');
				// sort based on size / importance
				$labels.sort((a, b) => {
					return b.offsetHeight - a.offsetHeight;
				});
				// check if they conflict, if so, hide them
				$labels.each((index, element) => {
					const position = $(element).offset();
					const point = {
						minX: position.left,
						maxX: position.left + element.offsetWidth,
						minY: position.top,
						maxY: position.top + element.offsetHeight
					};
					const collision = tree.searchRectangle(
						point.minX,
						point.maxX,
						point.minY,
						point.maxY);
					if (collision) {
						element.style.visibility = 'hidden';
					} else {
						element.style.visibility = 'visible';
						tree.insert([ point ]);
					}
				});
			};
			this.on(EventType.DOM_POST_DRAW, this.deconflict);
		}
		$(this.container).on('mouseover', this[MOUSE_OVER]);
		$(this.container).on('mouseout', this[MOUSE_OUT]);
		$(this.container).on('click', this[CLICK]);
	}

	onRemove(layer) {
		$(this.container).off('mouseover', this[MOUSE_OVER]);
		$(this.container).off('mouseout', this[MOUSE_OUT]);
		$(this.container).off('click', this[CLICK]);
		if (this.labelDeconflict) {
			this.removeListener(lumo.POST_DRAW, this[DECONFLICT]);
			this[DECONFLICT] = null;
		}
		this[MOUSE_OVER] = null;
		this[MOUSE_OUT] = null;
		this[CLICK] = null;
		super.onRemove(layer);
	}

	onMouseOver(event) {
		const data = $(event.target).data('community');
		if (data) {
			this[PICK] = data;
		}
	}

	onMouseOut() {
		this[PICK] = null;
	}

	onClick(event) {
		const data = $(event.target).data('community');
		if (data) {
			this[PICK] = data;
		}
	}

	pick() {
		return this[PICK];
	}

	drawTile(element, tile) {
		const hits = tile.data.hits;
		const points = tile.data.points;

		if (!hits) {
			return;
		}

		const layer = this.layer;
		const sortField = layer.sortField;
		const extrema = layer.getExtrema(tile.coord.z);

		let divs = $();
		hits.forEach((community, index) => {

			const label = get(community, this.labelField);
			if (!label) {
				return;
			}

			const val = get(community, sortField);
			const nval = Transform.transform(val, this.transform, extrema);

			if (nval < this.labelThreshold) {
				return;
			}

			// normalize the nval as it is currently in the range [this.labelThreshold : 1]
			const rnval = (nval - this.labelThreshold) / (1.0 - this.labelThreshold);
			const zIndex = Math.ceil(100 * rnval);
			const fontSize = this.minFontSize + (rnval * (this.maxFontSize - this.minFontSize));
			const opacity = this.minOpacity + (rnval * (this.maxOpacity - this.minOpacity));
			const height = fontSize + HEIGHT_BUFFER; // add buffer to prevent cutoff of some letters
			const width = Math.min(getTextWidth(label, fontSize, this.fontFamily, 10), this.labelMaxLength);

			// get position
			const x = points[index*2] - (width / 2);
			const y = points[index*2+1] - (height / 2);

			const div = $(`
				<div class="community-label" style="
					left: ${x}px;
					bottom: ${y}px;
					opacity: ${opacity};
					z-index: ${zIndex};
					width: ${width}px;
					height: ${height}px;
					font-size: ${fontSize}pt;
					line-height: ${fontSize}px;">${label}</div>
				`);

			div.data('community', community);
			divs = divs.add(div);
		});
		$(element).empty().append(divs);
	}
}

module.exports = CommunityLabel;
