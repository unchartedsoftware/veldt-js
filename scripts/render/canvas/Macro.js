'use strict';

const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');

class Macro extends lumo.CanvasVertexTileRenderer {

	constructor(options = {}) {
		super(options);
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.outlineColor = defaultTo(options.outlineColor, [ 0.0, 0.0, 0.0, 1.0 ]);
		this.outlineWidth = defaultTo(options.outlineWidth, 2.0);
		this.radius = defaultTo(options.radius, 2);
		this.array = null;
	}

	onAdd(layer) {
		super.onAdd(layer);
		const radius = this.radius + (this.outlineWidth / 2);
		const tileSize = layer.plot.tileSize;
		this.array = this.createCanvasArray(tileSize + (radius * 2), true);
		return this;
	}

	onRemove(layer) {
		this.destroyCanvasArray(this.array);
		this.array = null;
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

	draw() {
		this.drawCanvasRenderables(this.array, true);
		return this;
	}
}

module.exports = Macro;
