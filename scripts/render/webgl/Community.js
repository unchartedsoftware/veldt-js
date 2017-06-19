'use strict';

const get = require('lodash/get');
const lumo = require('lumo');
const defaultTo = require('lodash/defaultTo');
const WebGLRenderer = require('./WebGLRenderer');
const Ring = require('./shape/Ring');

const addTile = function(atlas, tile) {
	const coord = tile.coord;
	const data = tile.data;
	const hits = data.hits;
	const points = data.points;
	const numPoints = points.length / 2;
	const radiusField = this.radiusField;
	const radiusScale = Math.pow(2, coord.z);
	const ringOffset = this.ringOffset;
	const vertices = new Float32Array(numPoints * 3);
	for (let i=0; i<numPoints; i++) {
		const hit = hits[i];
		const x = points[i*2];
		const y = points[i*2+1];
		const radius = get(hit, radiusField) * radiusScale + ringOffset;
		vertices[i*3] = x;
		vertices[i*3+1] = y;
		vertices[i*3+2] = radius;
	}
	atlas.set(coord.hash, vertices, vertices.length / atlas.stride);
};

const createCollidables = function(tile, xOffset, yOffset) {
	const data = tile.data;
	const hits = data.hits;
	const points = data.points;
	const numHits = hits ? hits.length : 0;
	const radiusScale = Math.pow(2, tile.coord.z);
	const radiusField = this.radiusField;
	const radiusBuffer = this.radiusBuffer;
	const totalOffset =
		(this.ringWidth / 2) + // width
		this.outlineWidth + // outline
		this.ringOffset; // offset
	const collidables = new Array(numHits);
	for (let i=0; i<numHits; i++) {
		const hit = hits[i];
		const x = points[i*2];
		const y = points[i*2+1];
		const radius = get(hit, radiusField) * radiusScale + totalOffset;
		collidables[i] = new lumo.RingCollidable(
			x,
			y,
			radius,
			radiusBuffer * 2, // width
			xOffset,
			yOffset,
			tile,
			hit);
	}
	return collidables;
};

class Community extends WebGLRenderer {

	constructor(options = {}) {
		super(options);
		this.atlas = null;
		this.ringFill = null;
		this.ringOutline = null;
		this.tree = null;
		this.color = defaultTo(options.color, [ 1.0, 1.0, 1.0, 1.0 ]);
		this.outlineColor = defaultTo(options.outlineColor, [ 0.0, 0.0, 0.0, 1.0 ]);
		this.highlightedColor = defaultTo(options.highlightedColor, [ 1.0, 0.5, 1.0, 1.0 ]);
		this.selectedColor = defaultTo(options.selectedColor, [ 1.0, 0.5, 1.0, 1.0 ]);
		this.ringWidth = defaultTo(options.ringWidth, 2);
		this.ringOffset = defaultTo(options.ringOffset, 0);
		this.outlineWidth = defaultTo(options.outlineWidth, 1);
		this.radiusField = defaultTo(options.radiusField, 'radius');
		this.hideUntilHover = defaultTo(options.hideUntilHover, false);
		this.radiusBuffer = defaultTo(options.radiusBuffer, 4);
	}

	onAdd(layer) {
		super.onAdd(layer);
		// ring fill
		this.ringFill = new Ring(this, this.ringWidth);
		// ring outline
		this.ringOutline = new Ring(this, this.ringWidth + (this.outlineWidth * 2));
		// offset atlas
		this.atlas = this.createVertexAtlas({
			chunkSize: this.layer.hitsCount,
			attributePointers: {
				// offset
				1: {
					size: 2,
					type: 'FLOAT'
				},
				// radius
				2: {
					size: 1,
					type: 'FLOAT'
				}
			},
			onAdd: addTile.bind(this)
		});
		// r-tree
		this.tree = this.createRTreePyramid({
			createCollidables: createCollidables.bind(this)
		});
		return this;
	}

	onRemove(layer) {
		this.destroyVertexAtlas(this.atlas);
		this.destroyRTreePyramid(this.tree);
		this.tree = null;
		this.atlas = null;
		this.ringFill = null;
		this.ringOutline = null;
		super.onRemove(layer);
		return this;
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
		const gl = this.gl;
		const layer = this.layer;
		const opacity = layer.getOpacity();

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		if (!this.hideUntilHover) {
			// draw outline
			this.ringOutline.drawInstanced(
				this.atlas,
				this.outlineColor,
				opacity);
			// draw fill
			this.ringFill.drawInstanced(
				this.atlas,
				this.color,
				opacity);
		}

		// render selected
		const selection = layer.getSelected();
		for (let i=0; i<selection.length; i++) {
			const selected = selection[i];
			// draw outline
			this.ringOutline.drawIndividual(
				selected,
				this.outlineColor,
				opacity);
			// draw fill
			this.ringFill.drawIndividual(
				selected,
				this.selectedColor,
				opacity);
		}

		// render highlighted
		if (layer.highlighted && !layer.isSelected(layer.highlighted)) {
			// draw outline
			this.ringOutline.drawIndividual(
				layer.highlighted,
				this.outlineColor,
				opacity);
			// draw fill
			this.ringFill.drawIndividual(
				layer.highlighted,
				this.highlightedColor,
				opacity);
		}

		return this;
	}

}

module.exports = Community;
