'use strict';

const clamp = require('lodash/clamp');
const defaultTo = require('lodash/defaultTo');
const ColorRamp = require('../color/ColorRamp');
const Transform = require('../transform/Transform');
const CanvasRenderer = require('../dom/CanvasRenderer');

let swapCanvas = null;

class Heatmap extends CanvasRenderer {

	constructor(options = {}) {
		super(options);
		this.transform = defaultTo(options.transform, 'log10');
		this.range = defaultTo(options.range, { min: 0, max: 1 });
		this.colorRamp = defaultTo(options.colorRamp, 'verdant');
	}

	setTransform(transform) {
		if (this.transform !== transform) {
			this.transform = transform;
			if (this.plot) {
				this.renderer.redraw(true);
			}
		}
	}

	getTransform() {
		return this.transform;
	}

	setValueRange(min, max) {
		if (this.range.min !== min ||
			this.range.max !== max) {
			this.range = {
				min: clamp(min, 0, 1),
				max: clamp(max, 0, 1)
			};
			if (this.plot) {
				this.renderer.redraw(true);
			}
		}
	}

	getValueRange() {
		return [
			this.range[0],
			this.range[1]
		];
	}

	setColorRamp(colorRamp) {
		if (this.colorRamp !== colorRamp) {
			this.colorRamp = colorRamp;
			if (this.plot) {
				this.renderer.redraw(true);
			}
		}
	}

	getColorRamp() {
		return this.colorRamp;
	}

	getColorRampFunc() {
		return ColorRamp.getFunc(this.colorRamp);
	}

	blitCanvas(canvas, bins, resolution, transform, extrema, range, colorRamp) {
		if (!swapCanvas) {
			swapCanvas = document.createElement('canvas');
			swapCanvas.height = resolution;
			swapCanvas.width = resolution;
		}
		const swapCtx = swapCanvas.getContext('2d');
		const imageData = swapCtx.getImageData(0, 0, resolution, resolution);
		const data = imageData.data;
		const colorRampFunc = ColorRamp.getFunc(colorRamp);
		const color = [0, 0, 0, 0];
		const size = resolution * resolution;
		for (let i=0; i<bins.length; i++) {
			const bin = bins[i];
			if (bin === 0) {
				color[0] = 0;
				color[1] = 0;
				color[2] = 0;
				color[3] = 0;
			} else {
				const nval = Transform.transform(bin, transform, extrema);
				const rval = Transform.interpolate(nval, range);
				colorRampFunc(rval, color);
			}
			const col = (i % resolution);
			const row = Math.floor(i / resolution);
			const j = (size - (resolution - col) - (row * resolution)) * 4;
			data[j] = color[0];
			data[j + 1] = color[1];
			data[j + 2] = color[2];
			data[j + 3] = color[3];
		}
		swapCtx.putImageData(imageData, 0, 0);
		// re-draw
		const ctx = canvas.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(
				swapCanvas,
				0, 0,
				resolution, resolution,
				0, 0,
				canvas.width, canvas.height);
		return canvas;
	};

	drawTile(element, tile) {
		this.blitCanvas(
			element,
			new Uint32Array(tile.data),
			this.layer.resolution,
			this.transform,
			this.layer.getExtrema(),
			this.range,
			this.colorRamp);
	}
}

module.exports = Heatmap;
