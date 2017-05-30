'use strict';

const lumo = require('lumo');
const clamp = require('lodash/clamp');
const defaultTo = require('lodash/defaultTo');
const WebGLRenderer = require('./WebGLRenderer');
const Edge = require('./shape/Edge');
const ColorRamp = require('../color/ColorRamp');

const addTile = function(atlas, tile) {
	const edges = (this.layer.lod > 0) ? tile.data.edges : tile.data;
	const extent = Math.pow(2, 16);
	const bounds = new lumo.Bounds(-extent, extent, -extent, extent);
	for (let i=0; i<edges.length; i+=6) {
		const ax = edges[i];
		const ay = edges[i+1];
		const bx = edges[i+3];
		const by = edges[i+4];
		const clipped = bounds.clipLine(
			{ x: ax, y: ay, },
			{ x: bx, y: by, });
		edges[i] = clipped.a.x;
		edges[i+1] = clipped.a.y;
		edges[i+3] = clipped.b.x;
		edges[i+4] = clipped.b.y;
	}
	atlas.set(
		tile.coord.hash,
		edges,
		edges.length / atlas.stride);
};

class MacroEdge extends WebGLRenderer {

	constructor(options = {}) {
		super(options);
		this.edge = null;
		this.atlas = null;
		this.transform = defaultTo(options.transform, 'log10');
		this.range = defaultTo(options.range, [0, 1]);
		this.colorRamp = defaultTo(options.colorRamp, 'cool');
		this.ext = null;
	}

	onAdd(layer) {
		super.onAdd(layer);
		this.ext = null; // this.gl.getExtension('EXT_blend_minmax');
		this.edge = new Edge(this, this.transform, this.colorRamp);
		this.atlas = this.createVertexAtlas({
			chunkSize: this.layer.hitsCount * 2,
			attributePointers: {
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
			},
			onAdd: addTile.bind(this)
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
		this.edge.setColorRamp(colorRamp);
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
			gl.blendEquation(this.ext.MAX_EXT);
			gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
		} else {
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		}

		// draw instances
		this.edge.drawInstanced(this.atlas, this.layer.getOpacity());

		// revert to default blend equation
		if (this.ext) {
			gl.blendEquation(gl.FUNC_ADD);
		}

		return this;
	}

}

module.exports = MacroEdge;
