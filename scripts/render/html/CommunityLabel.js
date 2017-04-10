'use strict';

const $ = require('jquery');
const get = require('lodash/get');
const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const Transform = require('../transform/Transform');

const HEIGHT_BUFFER = 4;

class CommunityLabel extends lumo.HTMLRenderer {

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
		if (this.labelDeconflict) {
			this.deconflict = () => {
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
			this.on(lumo.POST_DRAW, this.deconflict);
		}
		$(this.container).on('mouseover', this.mouseover);
		$(this.container).on('mouseout', this.mouseout);
		$(this.container).on('click', this.click);
	}

	onRemove(layer) {
		$(this.container).off('mouseover', this.mouseover);
		$(this.container).off('mouseout', this.mouseout);
		$(this.container).off('click', this.click);
		if (this.labelDeconflict) {
			this.removeListener(lumo.POST_DRAW, this.deconflict);
		}
		this.mouseover = null;
		this.mouseout = null;
		this.click = null;
		super.onRemove(layer);
	}

	onMouseOver(event) {
		const data = $(event.target).data('community');
		if (data) {
			this.emit(lumo.MOUSE_OVER, new lumo.MouseEvent(
				this.layer,
				this.getMouseButton(event),
				this.mouseToPlot(event),
				data
			));
		}
	}

	onMouseOut(event) {
		const data = $(event.target).data('community');
		if (data) {
			this.emit(lumo.MOUSE_OUT, new lumo.MouseEvent(
				this.layer,
				this.getMouseButton(event),
				this.mouseToPlot(event)
			));
		}
	}

	onClick(event) {
		const data = $(event.target).data('community');
		if (data) {
			this.emit(lumo.CLICK, new lumo.MouseEvent(
				this.layer,
				this.getMouseButton(event),
				this.mouseToPlot(event),
				data
			));
		}
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
			const width = Math.min(this.getTextWidth(label, fontSize, this.fontFamily, 10), this.labelMaxLength);

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

	getTextWidth(text, fontSize, fontFamily, buffer) {
		const font = `${fontSize}pt ${fontFamily}`;
		// re-use canvas object for better performance
		const canvas = this.getTextWidth.canvas ||
			(this.getTextWidth.canvas = document.createElement("canvas"));
		const context = canvas.getContext("2d");
		context.font = font;
		var metrics = context.measureText(text);
		return Math.floor(metrics.width) + 1 + buffer;
	}
}

module.exports = CommunityLabel;
