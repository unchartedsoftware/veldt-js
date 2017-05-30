'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');

const POINT_RADIUS_INC = 4;

const drawPoint = function(ctx, plot, target, color, radiusOffset) {
	const coord = target.tile.coord;
	const scale = Math.pow(2, plot.zoom - coord.z);
	const viewport = plot.getViewportPixelOffset();
	const viewSize = plot.getViewportPixelSize();
	const pixelRatio = plot.pixelRatio;
	const plotX = (((coord.x * plot.tileSize) + target.x) * scale) - viewport.x;
	const plotY = (((coord.y * plot.tileSize) + target.y) * scale) - viewport.y;
	const sx = plotX * pixelRatio;
	const sy = (viewSize.height - plotY) * pixelRatio;
	const sradius = (target.radius + radiusOffset) * pixelRatio;
	ctx.beginPath();
	ctx.moveTo(sx, sy);
	ctx.arc(sx, sy, sradius, 0, Math.PI * 2);
	ctx.globalCompositeOperation = 'lighter';
	ctx.fillStyle = `rgba(
		${Math.floor(color[0]*255)},
		${Math.floor(color[1]*255)},
		${Math.floor(color[2]*255)},
		${color[3]})`;
	ctx.fill();
	ctx.globalCompositeOperation = 'source-over';
};

class Micro extends lumo.CanvasVertexTileRenderer {

	constructor(options = {}) {
		super(options);
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.radius = defaultTo(options.radius, 4);
		this.outlineColor = defaultTo(options.outlineColor, [ 0.0, 0.0, 0.0, 1.0 ]);
		this.outlineWidth = defaultTo(options.outlineWidth, 2.0);
		this.array = null;
		this.tree = null;
	}

	onAdd(layer) {
		super.onAdd(layer);
		const radius = this.radius + (this.outlineWidth / 2);
		const tileSize = layer.plot.tileSize;
		this.array = this.createCanvasArray(tileSize + radius*2, true);
		this.tree = this.createRTreePyramid(32);
		return this;
	}

	onRemove(layer) {
		this.destroyRTreePyramid(this.tree);
		this.destroyCanvasArray(this.array);
		this.array = null;
		this.tree = null;
		super.onRemove(layer);
		return this;
	}

	addTile(array, tile) {
		const radius = this.radius + (this.outlineWidth / 2);
		const pixelRatio = this.layer.plot.pixelRatio;
		const chunk = array.allocate(tile.coord.hash);
		const canvas = chunk.canvas;
		const ctx = chunk.ctx;
		const color = this.color;
		const outlineColor = this.outlineColor;
		const points = (this.layer.lod > 0) ? tile.data.points : tile.data;
		const radians = Math.PI * 2.0;
		// set drawing styles
		ctx.globalCompositeOperation = 'lighter';
		ctx.fillStyle = `rgba(
			${Math.floor(color[0]*255)},
			${Math.floor(color[1]*255)},
			${Math.floor(color[2]*255)},
			${color[3]})`;
		ctx.lineWidth = this.outlineWidth;
		ctx.strokeStyle = `rgba(
			${Math.floor(outlineColor[0]*255)},
			${Math.floor(outlineColor[1]*255)},
			${Math.floor(outlineColor[2]*255)},
			${outlineColor[3]})`;
		// draw points
		for (let i=0; i<points.length; i+=2) {
			const x = points[i] + radius;
			const y = points[i+1] + radius;
			const sx = x * pixelRatio;
			const sy = canvas.height - (y * pixelRatio);
			const sradius = radius * pixelRatio;
			ctx.beginPath();
			ctx.moveTo(sx, sy);
			ctx.arc(sx, sy, sradius, 0, radians);
			ctx.fill();
			ctx.stroke();
		}
	}

	createCollidables(tile, xOffset, yOffset) {
		const data = tile.data;
		const points = data.points;
		const hits = data.hits;
		const numHits = hits ? hits.length : 0;
		const radius = this.radius + this.outlineWidth;
		const collidables = new Array(numHits);
		for (let i=0; i<numHits; i++) {
			const x = points[i*2];
			const y = points[i*2+1];
			collidables[i] = new lumo.CircleCollidable(
				x,
				y,
				radius,
				xOffset,
				yOffset,
				tile,
				hits[i]);
		}
		return collidables;
	}

	pick(pos) {
		if (this.layer.plot.isZooming()) {
			return null;
		}
		return this.tree.searchPoint(
			pos.x,
			pos.y,
			this.layer.plot.zoom,
			this.layer.plot.getPixelExtent());
	}

	draw() {
		const ctx = this.ctx;
		const layer = this.layer;
		const plot = layer.plot;
		const color = this.color;

		// draw the pre-rendered images
		this.drawCanvasRenderables(this.array, true);

		// set opacity
		ctx.globalAlpha = layer.opacity;

		// render selected
		layer.getSelected().forEach(selected => {
			drawPoint(ctx, plot, selected, color, POINT_RADIUS_INC * 2);
		});

		// render highlighted
		const highlighted = layer.getHighlighted();
		if (highlighted && !layer.isSelected(highlighted)) {
			drawPoint(ctx, plot, highlighted, color, POINT_RADIUS_INC);
		}

		// clear opacity
		ctx.globalAlpha = 1.0;

		return this;
	}
}

module.exports = Micro;
