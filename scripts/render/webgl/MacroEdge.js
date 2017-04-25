'use strict';

const clamp = require('lodash/clamp');
const defaultTo = require('lodash/defaultTo');
const VertexRenderer = require('./VertexRenderer');
const Edge = require('../shape/Edge');
const ColorRamp = require('../color/ColorRamp');

class MacroEdge extends VertexRenderer {

	constructor(options = {}) {
		super(options);
		this.edge = null;
		this.atlas = null;
		this.transform = defaultTo(options.transform, 'log10');
		this.range = defaultTo(options.range, [0, 1]);
		this.colorRamp = defaultTo(options.colorRamp, 'cool');
		this.ext = null;
	}

	addTile(atlas, tile) {
		const edges = (this.layer.lod > 0) ? tile.data.edges : tile.data;
		atlas.set(
			tile.coord.hash,
			edges,
			edges.length / atlas.stride);
	}

	onAdd(layer) {
		super.onAdd(layer);
		// TODO: fix this
		//this.ext = this.gl.getExtension('EXT_blend_minmax');
		this.edge = new Edge(this, this.transform, this.colorRamp);
		this.atlas = this.createVertexAtlas({
			// position
			0: {
				size: 2,
				type: 'FLOAT'
			},
			// weight
			1: {
				size: 1,
				type: 'FLOAT'
			}
		});
		return this;
	}

	onRemove(layer) {
		this.destroyVertexAtlas(this.atlas);
		this.atlas = null;
		this.edge = null;
		super.onRemove(layer);
		return this;
	}

	setTransform(transform) {
		this.transform = transform;
		this.edge.setTransform(this.transform);

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
		this.edge.setTransform(colorRamp);

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

		const gl = this.gl;

		// set blending func
		gl.enable(gl.BLEND);

		if (this.ext) {
			// set max blend equation for color
			gl.blendFuncSeparate(
				gl.SRC_COLOR, gl.DST_COLOR, // rgb
				gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // alpha
			gl.blendEquationSeparate(
				this.ext.MAX_EXT, // rgb
				gl.FUNC_ADD); // alpha
		} else {
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		}

		// draw instances
		this.edge.drawInstanced(this.atlas, this.layer.getOpacity());

		// revert to default blend equation
		if (this.ext) {
			gl.blendFuncSeparate(
				gl.ONE, gl.ZERO, // rgb
				gl.ONE, gl.ZERO); // alpha
			gl.blendEquationSeparate(
				gl.FUNC_ADD, // rgb
				gl.FUNC_ADD); // alpha
		}

		return this;
	}

}

module.exports = MacroEdge;
