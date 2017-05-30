'use strict';

const lumo = require('lumo');

const TILE_ADD = Symbol();

class Repeat extends lumo.CanvasTileRenderer {

	constructor(options = {}) {
		super(options);
		this.canvas = null;
	}

	onAdd(layer) {
		super.onAdd(layer);
		// create handlers
	 	this[TILE_ADD] = event => {
			if (!this.canvas) {
				const data = event.tile.data;
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				if (data.width !== undefined && data.height !== undefined) {
					// image
					canvas.width = data.width;
					canvas.height = data.height;
					ctx.drawImage(data, 0, 0);
				} else {
					// buffer
					const pixels = new Uint8ClampedArray(data);
					const resolution = pixels.length / 4;
					canvas.width = resolution;
					canvas.height = resolution;
					const imageData = ctx.getImageData(0, 0, resolution, resolution);
					imageData.data.set(new Uint8ClampedArray(data));
					ctx.putImageData(imageData, 0, 0);
				}
				this.canvas = canvas;
			}
		};
		// attach handlers
		this.layer.on(lumo.TILE_ADD, this[TILE_ADD]);
		return this;
	}

	onRemove(layer) {
		// detach handlers
		this.layer.removeListener(lumo.TILE_ADD, this[TILE_ADD]);
		// delete handlers
		this[TILE_ADD] = null;
		this.canvas = null;
		super.onRemove(layer);
		return this;
	}

	draw() {
		if (!this.canvas) {
			return;
		}
		const canvas = this.canvas;
		const ctx = this.ctx;
		const plot = this.layer.plot;
		const tileSize = plot.tileSize;
		const pixelRatio = plot.pixelRatio;
		const viewport = plot.getViewportPixelOffset();
		const viewSize = plot.getViewportPixelSize();

		// get all currently visible tile coords
		const coords = plot.getVisibleCoords();

		// set layer opacity
		ctx.globalAlpha = this.layer.opacity;

		// draw the tile
		for (let i=0; i<coords.length; i++) {
			const coord = coords[i];
			const scale = Math.pow(2, plot.zoom - coord.z);
			const dstX = ((coord.x * tileSize) * scale - viewport.x) * pixelRatio;
			const dstY = (viewSize.height - (((coord.y * tileSize) + tileSize) * scale - viewport.y)) * pixelRatio;
			const dstSize = tileSize * scale * pixelRatio;
			ctx.drawImage(
				canvas,
				dstX,
				dstY,
				dstSize,
				dstSize);
		}
		// reset opacity
		ctx.globalAlpha = 1.0;
	}
}

module.exports = Repeat;
