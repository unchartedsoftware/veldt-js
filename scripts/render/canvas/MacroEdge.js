'use strict';

const lumo = require('lumo');
const clamp = require('lodash/clamp');
const defaultTo = require('lodash/defaultTo');
const ColorRamp = require('../color/ColorRamp');
const Transform = require('../transform/Transform');

class MacroEdge extends lumo.CanvasTileRenderer {

	constructor(options = {}) {
		super(options);
		this.transform = defaultTo(options.transform, 'log10');
		this.range = defaultTo(options.range, [0, 1]);
		this.colorRamp = defaultTo(options.colorRamp, 'cool');
	}

	setTransform(transform) {
		this.transform = transform;
		if (this.layer.plot) {
			this.layer.plot.setDirty();
		}
		return this;
	}

	getTransform() {
		return this.transform;
	}

	setValueRange(min, max) {
		this.range = [
			clamp(min, 0, 1),
			clamp(max, 0, 1)
		];
		if (this.layer.plot) {
			this.layer.plot.setDirty();
		}
	}

	getValueRange() {
		return [
			this.range[0],
			this.range[1]
		];
	}

	setColorRamp(colorRamp) {
		this.colorRamp = colorRamp;
		if (this.layer.plot) {
			this.layer.plot.setDirty();
		}
	}

	getColorRamp() {
		return this.colorRamp;
	}

	getColorRampFunc() {
		return ColorRamp.getFunc(this.colorRamp);
	}

	draw() {
		const ctx = this.ctx;
		const layer = this.layer;
		const plot = layer.plot;
		const opacity = layer.opacity;
		const tileSize = plot.tileSize;
		const renderables = this.getRenderables();
		const viewport = plot.getViewportPixelSize();
		const colorRamp = ColorRamp.getFunc(this.colorRamp);
		const pixelRatio = plot.pixelRatio;

		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineWidth = 1;

		const srcColor = [ 0, 0, 0, 0 ];
		const dstColor = [ 0, 0, 0, 0 ];

		for (let i=0; i<renderables.length; i++) {
			const renderable = renderables[i].toCanvas(viewport, tileSize);
			const offset = renderable.tileOffset;
			const scale = renderable.scale;
			const edges = renderable.tile.data;

			const extrema = this.layer.getExtrema(renderable.tile.coord.z);

			for (let j=0; j<edges.length; j+=6) {
				const ax = ((edges[j] * scale) + offset[0]) * pixelRatio;
				const ay = ((tileSize - edges[j+1]) * scale + offset[1]) * pixelRatio;
				const aw = edges[j+2];
				const bx = ((edges[j+3] * scale) + offset[0]) * pixelRatio;
				const by = ((tileSize - edges[j+4]) * scale + offset[1]) * pixelRatio;
				const bw = edges[j+5];

				const srcVal = Transform.transform(aw, this.transform, extrema);
				const dstVal = Transform.transform(bw, this.transform, extrema);
				colorRamp(srcVal, srcColor);
				colorRamp(dstVal, srcColor);

				const grad = ctx.createLinearGradient(ax, ay, bx, by);
				grad.addColorStop(0, `rgba(
					${Math.floor(srcColor[0]*255)},
					${Math.floor(srcColor[1]*255)},
					${Math.floor(srcColor[2]*255)},
					${srcColor[3] * opacity})`);
				grad.addColorStop(1, `rgba(
					${Math.floor(dstColor[0]*255)},
					${Math.floor(dstColor[1]*255)},
					${Math.floor(dstColor[2]*255)},
					${dstColor[3] * opacity})`);

				ctx.strokeStyle = grad;
				ctx.beginPath();
				ctx.moveTo(ax, ay);
				ctx.lineTo(bx, by);
				ctx.stroke();
			}
		}
		return this;
	}

}

module.exports = MacroEdge;
