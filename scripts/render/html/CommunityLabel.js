'use strict';

const _ = require('lodash');
const $ = require('jquery');
const lumo = require('lumo');
const Transform = require('../transform/Transform');

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
		this.xField = _.defaultTo(options.xField, 'x');
		this.yField = _.defaultTo(options.yField, 'y');
		this.minFontSize = _.defaultTo(options.minFontSize, 10);
		this.maxFontSize = _.defaultTo(options.maxFontSize, 24);
		this.minOpacity = _.defaultTo(options.minOpacity, 0.5);
		this.maxOpacity = _.defaultTo(options.maxOpacity, 1.0);
		this.labelMaxLength = _.defaultTo(options.labelMaxLength, 256);
		this.labelThreshold = _.defaultTo(options.labelThreshold, 0.6);
		this.labelField = _.defaultTo(options.labelField, 'metadata');
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
		const plot = this.layer.plot;
		this.emit(lumo.MOUSE_OVER, new lumo.MouseEvent(
			this.layer,
			getMouseButton(event),
			plot.mouseToViewPx(),
			plot.mouseToPlotPx(),
			data
		));
	}

	onMouseOut(event) {
		const plot = this.layer.plot;
		this.emit(lumo.MOUSE_OVER, new lumo.MouseEvent(
			this.layer,
			getMouseButton(event),
			plot.mouseToViewPx(),
			plot.mouseToPlotPx()
		));
	}

	onClick(event) {
		const data = $(event.target).data('community');
		const plot = this.layer.plot;
		this.emit(lumo.MOUSE_OVER, new lumo.MouseEvent(
			this.layer,
			getMouseButton(event),
			plot.mouseToViewPx(),
			plot.mouseToPlotPx(),
			data
		));
	}

	drawTile(element, tile) {

		const scale = Math.pow(2, tile.coord.z);
		const tileSize = this.layer.plot.tileSize;
		const tileSpan = Math.pow(2, 32) / scale;
		const params = this.layer.getParams().top_hits;
		const sortField = params.top_hits.sort ? params.top_hits.sort : null;

		let divs = $();
		tile.data.forEach(community => {

			const label = _.get(community, this.labelField);
			if (!label) {
				return;
			}

			const val = _.get(community, sortField);
			const nval = Transform.transform(
				val,
				this.transform,
				this.getExtrema());

			if (nval < this.threshold) {
				return;
			}

			const x = _.get(community, this.xField);
			const y = _.get(community, this.getYField());
			const left = ((x % tileSpan) / tileSpan) * tileSize;
			const top = ((y % tileSpan) / tileSpan) * tileSize;

			// normalize the nval as it is currently in the range [this.threshold : 1]
			const rnval = (nval - this.threshold) / (1.0 - this.threshold);
			const zIndex = Math.ceil(100 * rnval);
			const fontSize = this.minFontSize + (rnval * (this.maxFontSize - this.minFontSize));
			const opacity = this.minOpacity + (rnval * (this.maxOpacity - this.minOpacity));
			const div = $(
				`
				<div class="community-label" style="
					left: ${left}px;
					top: ${top}px;
					opacity: ${opacity};
					font-size: ${fontSize}px;
					z-index: ${zIndex};
					line-height: ${fontSize}px;">${label}</div>
				`);
			div.data('community', community);
			divs = divs.add(div);
		});
		$(element).empty().append(divs);
	}
}

module.exports = CommunityLabel;
