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

class Community extends lumo.HTMLRenderer {

	constructor(options = {}) {
		super(options);
		this.xField = _.defaultTo(options.xField, 'x');
		this.yField = _.defaultTo(options.yField, 'y');
		this.padding = _.defaultTo(options.padding, 0);
		this.threshold = _.defaultTo(options.threshold, 0.5);
		this.radiusField = _.defaultTo(options.radiusField, 'node.radius');
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

	drawTile(container, tile) {

		const scale = Math.pow(2, tile.coord.z);
		const tileSpan = Math.pow(2, 32) / scale;
		const tileSize = this.layer.plot.tileSize;
		const params = this.layer.getParams().top_hits;
		const sortField = params.top_hits.sort ? params.top_hits.sort : null;

		let divs = $();
		tile.data.forEach(community => {
			const val = _.get(community, sortField);
			const nval = Transform.transform(
				val,
				this.transform,
				this.getExtrema());
			if (nval < this.threshold) {
				return;
			}
			const radius = this.padding + _.get(community, this.radiusField) * scale;
			const diameter = radius * 2;
			const x = _.get(community, this.getXField());
			const y = _.get(community, this.getYField());
			const left = ((x % tileSpan) / tileSpan) * tileSize;
			const top = ((y % tileSpan) / tileSpan) * tileSize;
			const div = $(
				`
				<div class="community-ring" style="
					left: ${left - radius}px;
					top: ${top - radius}px;
					width: ${diameter}px;
					height: ${diameter}px;">
				</div>
				`);
			div.data('community', community);
			divs = divs.add(div);
		});

		$(container).empty().append(divs);
	}
}

module.exports = Community;
