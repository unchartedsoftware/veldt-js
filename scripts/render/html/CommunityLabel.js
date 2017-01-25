'use strict';

const $ = require('jquery');
const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const Transform = require('../transform/Transform');

const HEIGHT_BUFFER = 4;

const getMouseButton = function(event) {
	if (event.which === 1) {
		return 'left';
	} else if (event.which === 2) {
		return 'middle';
	} else if (event.which === 3) {
		return 'right';
	}
};

class CommunityLabel extends lumo.HTMLRenderer {

	constructor(options = {}) {
		super(options);
		this.transform = defaultTo(options.transform, 'log10');
		this.minFontSize = defaultTo(options.minFontSize, 10);
		this.maxFontSize = defaultTo(options.maxFontSize, 24);
		this.minOpacity = defaultTo(options.minOpacity, 0.6);
		this.maxOpacity = defaultTo(options.maxOpacity, 1.0);
		this.labelMaxLength = defaultTo(options.labelMaxLength, 256);
		this.labelThreshold = defaultTo(options.labelThreshold, 0.6);
		this.labelField = defaultTo(options.labelField, 'metadata');
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

	onMouseOver(event) {
		const data = $(event.target).data('community');
		if (data) {
			const plot = this.layer.plot;
			this.emit(lumo.MOUSE_OVER, new lumo.MouseEvent(
				this.layer,
				getMouseButton(event),
				plot.mouseToViewPx(event),
				plot.mouseToPlotPx(event),
				data
			));
		}
	}

	onMouseOut(event) {
		const data = $(event.target).data('community');
		if (data) {
			const plot = this.layer.plot;
			this.emit(lumo.MOUSE_OUT, new lumo.MouseEvent(
				this.layer,
				getMouseButton(event),
				plot.mouseToViewPx(event),
				plot.mouseToPlotPx(event)
			));
		}
	}

	onClick(event) {
		const data = $(event.target).data('community');
		if (data) {
			const plot = this.layer.plot;
			this.emit(lumo.CLICK, new lumo.MouseEvent(
				this.layer,
				getMouseButton(event),
				plot.mouseToViewPx(event),
				plot.mouseToPlotPx(event),
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

			const label = community[this.labelField];
			if (!label) {
				return;
			}

			const val = community[sortField];
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

			// get position
			const x = points[index*2] - (this.labelMaxLength / 2);
			const y = points[index*2+1] - (height / 2);

			const div = $(`
				<div class="community-label" style="
					left: ${x}px;
					bottom: ${y}px;
					opacity: ${opacity};
					z-index: ${zIndex};
					width: ${this.labelMaxLength}px;
					height: ${height}px;
					font-size: ${fontSize}px;
					line-height: ${fontSize}px;">${label}</div>
				`);
			div.data('community', community);
			divs = divs.add(div);
		});
		$(element).empty().append(divs);
	}
}

module.exports = CommunityLabel;
