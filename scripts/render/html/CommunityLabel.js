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
	const context = MEASURE_CANVAS.getContext('2d');
	context.font = font;
	const metrics = context.measureText(text);
	return Math.floor(metrics.width) + 1 + buffer;
};

const sortLabel = function(a, b) {
	return b.offsetHeight - a.offsetHeight;
};

const createDeconflictionFunc = function($container) {
	return () => {
		const tree = new lumo.RTree({
			collisionType: lumo.RECTANGLE,
			nodeCapacity: 64
		});
		// grab all labels
		const $labels = $container.find('.community-label');
		// sort based on size / importance
		$labels.sort(sortLabel);
		// check if they conflict, if so, hide them
		for (let i=0; i<$labels.length; i++) {
			const element = $labels[i];
			const position = $(element).offset();
			const collision = tree.searchRectangle(
				position.left,
				position.left + element.offsetWidth,
				position.top,
				position.top + element.offsetHeight);
			if (collision) {
				element.style.visibility = 'hidden';
			} else {
				element.style.visibility = 'visible';
				const collidable = new lumo.RectangleCollidable(
					position.left,
					position.left + element.offsetWidth,
					position.top,
					position.top + element.offsetHeight,
					0, 0, null, null);
				tree.insert([ collidable ]);
			}
		}
	};
};

const getColorString = function (color) {
	if (color) {
		const red   = Math.round(color[0] * 255);
		const green = Math.round(color[1] * 255);
		const blue  = Math.round(color[2] * 255);
		return 'rgb('+red+','+green+','+blue+')';
	} else {
		return 'white';
	}
};

class CommunityLabel extends HTMLRenderer {

	constructor(options = {}) {
		super(options);
		this.transform = defaultTo(options.transform, 'log10');
		this.minFontSize = defaultTo(options.minFontSize, 10);
		this.maxFontSize = defaultTo(options.maxFontSize, 18);
		this.fontFamily = defaultTo(options.fontFamily, '\'Helvetica Neue\',sans-serif');
		this.fontColor = defaultTo(options.color, [1.0, 1.0, 1.0]);
		this.minOpacity = defaultTo(options.minOpacity, 0.6);
		this.maxOpacity = defaultTo(options.maxOpacity, 1.0);
		this.labelMaxLength = defaultTo(options.labelMaxLength, 256);
		this.labelThreshold = defaultTo(options.labelThreshold, 0.6);
		this.labelField = defaultTo(options.labelField, 'metadata');
		this.labelDeconflict = defaultTo(options.labelDeconflict, true);
		this.labelOffset = defaultTo(options.labelOffset, [0, 0]);
		this[PICK] = null;
		this[MOUSE_OVER] = null;
		this[MOUSE_OUT] = null;
		this[DECONFLICT] = null;
	}

	onAdd(layer) {
		super.onAdd(layer);
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
			this[DECONFLICT] = createDeconflictionFunc($(this.container));
			this.on(EventType.DOM_POST_DRAW, this[DECONFLICT]);
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

	onClick() {
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
		for (let i=0; i<hits.length; i++) {
			const community = hits[i];

			const label = get(community, this.labelField);
			if (!label) {
				continue;
			}

			const val = get(community, sortField);
			const nval = Transform.transform(val, this.transform, extrema);

			if (nval < this.labelThreshold) {
				continue;
			}

			// normalize the nval as it is currently in the range [this.labelThreshold : 1]
			const rnval = (nval - this.labelThreshold) / (1.0 - this.labelThreshold);
			const zIndex = Math.ceil(100 * rnval);
			const fontSize = this.minFontSize + (rnval * (this.maxFontSize - this.minFontSize));
			const opacity = this.minOpacity + (rnval * (this.maxOpacity - this.minOpacity));
			const height = fontSize + HEIGHT_BUFFER; // add buffer to prevent cutoff of some letters
			const width = Math.min(getTextWidth(label, fontSize, this.fontFamily, 10), this.labelMaxLength);
			const fontColor = getColorString(this.fontColor);

			// get position
			const x = points[i*2] - (width / 2) + this.labelOffset[0] * (width / 2);
			const y = points[i*2+1] - (height / 2) + this.labelOffset[1] * (height / 2);

			const div = $(`
				<div class="community-label" style="
					left: ${x}px;
					bottom: ${y}px;
					opacity: ${opacity};
					z-index: ${zIndex};
					width: ${width}px;
					height: ${height}pt;
					font-size: ${fontSize}pt;
					font-family: ${this.fontFamily};
                    color: ${fontColor};
					line-height: ${fontSize}pt;">${label}</div>
				`);

			div.data('community', community);
			divs = divs.add(div);
		}
		$(element).empty().append(divs);
	}
}

module.exports = CommunityLabel;
