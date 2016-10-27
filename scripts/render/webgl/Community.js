'use strict';

const defaultTo = require('lodash/defaultTo');
const get = require('lodash/get');
const lumo = require('lumo');
const Transform = require('../transform/Transform');
const Shaders = require('./Shaders');

const NUM_SLICES = 180;
const RING_RADIUS = 10;
const MIN_RADIUS = 4;

const createRing = function(numSegments, radius, outline) {
	const theta = (2 * Math.PI) / numSegments;
	// precalculate sine and cosine
	const c = Math.cos(theta);
	const s = Math.sin(theta);
	// start at angle = 0
	let x0 = 0;
	let y0 = radius - (outline / 2);
	let x1 = 0;
	let y1 = radius + (outline / 2);
	const degPerSeg = (360 / (numSegments+1));
	const positions = new Float32Array((numSegments + 1) * (3 + 3));
	for (let i = 0; i <= numSegments; i++) {
		positions[i*6] = x0;
		positions[i*6+1] = y0;
		positions[i*6+2] = i * degPerSeg;
		positions[i*6+3] = x1;
		positions[i*6+4] = y1;
		positions[i*6+5] = i * degPerSeg;
		// apply the rotation
		let t = x0;
		x0 = c * x0 - s * y0;
		y0 = s * t + c * y0;
		t = x1;
		x1 = c * x1 - s * y1;
		y1 = s * t + c * y1;
	}
	const pointers = {
		0: {
			size: 3, // x, y, degree
			type: 'FLOAT'
		}
	};
	const options = {
		mode: 'TRIANGLE_STRIP',
		count: positions.length / 3
	};
	return new lumo.VertexBuffer(positions, pointers, options);
};

const createQuad = function(left, right, bottom, top) {
	// quad vertices
	const vertices = new Float32Array([
		// positions
		left, bottom,
		right, bottom,
		right, top,
		left, bottom,
		right, top,
		left, top
	]);
	// quad buffer
	return new lumo.VertexBuffer(
		vertices,
		{
			0: {
				size: 2,
				type: 'FLOAT',
				byteOffset: 0
			}
		},
		{
			count: 6,
		});
};

const renderInstancedOutline = function(gl, atlas, ring, shader, plot, renderables, color) {

	// get projection
	const proj = plot.viewport.getOrthoMatrix();

	// bind shader
	shader.use();

	// set projection
	shader.setUniform('uProjectionMatrix', proj);
	shader.setUniform('uColor', color);
	shader.setUniform('uDegrees', 360);
	shader.setUniform('uRadiusOffset', RING_RADIUS);

	// bind shape
	ring.bind();

	// binds the buffer to instance
	atlas.bindInstanced();

	// for each renderable
	renderables.forEach(renderable => {
		// set tile scale
		shader.setUniform('uTileScale', renderable.scale);
		// get tile offset
		shader.setUniform('uTileOffset', renderable.tileOffset);
		// draw the instances
		atlas.drawInstanced(renderable.hash, ring.mode, ring.count);
	});

	// unbind
	atlas.unbindInstanced();

	// unbind quad
	ring.unbind();
};

const renderInstancedTick = function(gl, atlas, quad, shader, plot, renderables, color) {
	// get projection
	const proj = plot.viewport.getOrthoMatrix();

	// bind shader
	shader.use();

	// set projection
	shader.setUniform('uProjectionMatrix', proj);
	shader.setUniform('uColor', color);

	// bind shape
	quad.bind();

	// binds the buffer to instance
	atlas.bindInstanced();

	// for each renderable
	renderables.forEach(renderable => {
		// set tile scale
		shader.setUniform('uTileScale', renderable.scale);
		// get tile offset
		shader.setUniform('uTileOffset', renderable.tileOffset);
		// draw the instances
		atlas.drawInstanced(renderable.hash, quad.mode, quad.count);
	});

	// unbind
	atlas.unbindInstanced();

	// unbind quad
	quad.unbind();
};

const renderInstancedFill = function(gl, atlas, ring, shader, plot, renderables, segments) {

	// get projection
	const proj = plot.viewport.getOrthoMatrix();

	// bind shader
	shader.use();

	// set projection
	shader.setUniform('uProjectionMatrix', proj);
	shader.setUniform('uRadiusOffset', RING_RADIUS);

	// bind shape
	ring.bind();

	// binds the buffer to instance
	atlas.bindInstanced();

	// for each renderable
	renderables.forEach(renderable => {
		// set tile scale
		shader.setUniform('uTileScale', renderable.scale);
		// get tile offset
		shader.setUniform('uTileOffset', renderable.tileOffset);
		// TODO: instance this
		segments.forEach((segment) => {
			shader.setUniform('uColor', segment.color);
			shader.setUniform('uDegrees', segment.percent * 360);
			// draw the instances
			atlas.drawInstanced(renderable.hash, ring.mode, ring.count);
		});
	});

	// unbind
	atlas.unbindInstanced();

	// unbind quad
	ring.unbind();
};

const renderFill = function(gl, point, shader, proj, plot, target, segments, radiusOffset) {

	// get tile offset
	const coord = target.tile.coord;
	const scale = Math.pow(2, plot.zoom - coord.z);
	const tileOffset = [
		(coord.x * scale * plot.tileSize) + (scale * target.x) - plot.viewport.x,
		(coord.y * scale * plot.tileSize) + (scale * target.y) - plot.viewport.y
	];
	shader.setUniform('uTileOffset', tileOffset);
	shader.setUniform('uTileScale', scale);
	shader.setUniform('uRadiusOffset', radiusOffset + target.radius);

	// binds the buffer to instance
	point.bind();

	segments.forEach((segment) => {
		shader.setUniform('uColor', segment.color);
		shader.setUniform('uDegrees', segment.percent * 360);
		// draw the point
		point.draw();
	});

	// unbind
	point.unbind();
};

class Community extends lumo.WebGLInteractiveRenderer {

	constructor(options = {}) {
		super(options);
		this.shader = null;
		this.point = null;
		this.atlas = null;
		this.xField = defaultTo(options.xField, 'x');
		this.yField = defaultTo(options.yField, 'y');
		this.radiusField = defaultTo(options.radiusField, 'radius');
		this.outlineWidth = defaultTo(options.outlineWidth, 2);
		this.outlineColor = defaultTo(options.outlineColor, [0.0, 0.0, 0.0, 1.0]);
		this.ringWidth = defaultTo(options.ringWidth, 3);
		this.ringOffset = defaultTo(options.ringOffset, 0);
		this.tickWidth = defaultTo(options.tickWidth, 2);
		this.tickHeight = defaultTo(options.tickHeight, 8);
	}

	addTile(atlas, tile) {
		const coord = tile.coord;
		const data = tile.data;

		const tileSize = this.layer.plot.tileSize;
		const xOffset = coord.x * tileSize;
		const yOffset = coord.y * tileSize;
		const scale = Math.pow(2, coord.z);
		const tileSpan = Math.pow(2, 32) / scale;

		const xField = this.xField;
		const yField = this.yField;
		const radiusField = this.radiusField;
		const radiusOffset = this.ringOffset + this.ringWidth + this.outlineWidth;
		const params = this.layer.getParams().top_hits;
		const sortField = params.top_hits.sort ? params.top_hits.sort : null;

		const points = new Array(data.length);
		const vertices = new Float32Array(data.length * 3);

		for (let i=0; i<data.length; i++) {
			const community = data[i];

			const val = get(community, sortField);
			const nval = Transform.transform(val);

			if (nval < this.threshold) {
				continue;
			}

			const radius = get(community, radiusField);
			const scaledRadius = Math.max(MIN_RADIUS, (radius * scale) + radiusOffset);

			const xVal = get(community, xField);
			const yVal = get(community, yField);
			const x = ((xVal % tileSpan) / tileSpan) * tileSize;
			const y = ((yVal % tileSpan) / tileSpan) * tileSize;

			const plotX = x + xOffset;
			const plotY = y + yOffset;

			// add point to buffer
			vertices[i * 3] = x;
			vertices[i * 3 + 1] = y;
			vertices[i * 3 + 2] = scaledRadius;

			points[i] = {
				x: x,
				y: y,
				minX: plotX - scaledRadius,
				maxX: plotX + scaledRadius,
				minY: plotY - scaledRadius,
				maxY: plotY + scaledRadius,
				tile: tile,
				data: community
			};
		}

		this.addPoints(coord, points);
		atlas.set(coord.hash, vertices, points.length);
	}

	removeTile(atlas, tile) {
		const coord = tile.coord;
		atlas.delete(coord.hash);
		this.removePoints(coord);
	}

	onAdd(layer) {
		super.onAdd(layer);

		const fullWidth = this.ringWidth + this.outlineWidth;

		// create rings
		this.ringFill = createRing(this.gl, NUM_SLICES, RING_RADIUS);
		this.ringOutline = createRing(this.gl, NUM_SLICES, fullWidth);

		// create quad
		this.quad = createQuad(
			-this.tickWidth / 2,
			this.tickWidth / 2,
			-fullWidth / 2,
			this.tickHeight);

		this.shaders = new Map();
		this.shaders.set('individualRing', this.createShader(Shaders.ring));
		this.shaders.set('instancedRing', this.createShader(Shaders.instancedRing));
		this.shaders.set('instancedTick', this.createShader(Shaders.instancedTick));

		this.atlas = this.createVertexAtlas({
			1: {
				size: 2,
				type: 'FLOAT'
			},
			2: {
				size: 1,
				type: 'FLOAT'
			}
		});

		return this;
	}

	onRemove(layer) {
		this.destroyVertexAtlas(this.atlas);
		this.atlas = null;
		this.shaders = null;
		this.point = null;
		super.onRemove(layer);
		return this;
	}

	draw() {

		const plot = this.layer.plot;
		const projection = plot.viewport.getOrthoMatrix();
		const shader = this.shader;

		// bind render target
		plot.renderBuffer.bind();

		// TEMP
		const segments = [
			{
				color: [ 0.2, 0.2, 0.2, 1.0 ],
				percent: 1
			},
			{
				color: [ 0.4, 0.4, 0.4, 1.0 ],
				percent: 0.8
			},
			{
				color: [ 0.8, 0.8, 0.8, 1.0 ],
				percent: 0.4
			}
		];

		// draw instanced outlines
		renderInstancedOutline(
			this.gl,
			this.atlas,
			shader,
			projection,
			this.getRenderables(),
			this.outlineColor);

		// draw instanced fill
		renderInstancedFill(
			this.gl,
			this.atlas,
			shader,
			projection,
			this.getRenderables(),
			segments);

		if (this.highlighted) {
			// draw individual fill
			renderFill(
				this.gl,
				this.point,
				shader,
				projection,
				plot,
				this.highlighted,
				segments);
		}

		if (this.selected) {
			// draw individual fill
			renderFill(
				this.gl,
				this.point,
				shader,
				projection,
				plot,
				this.selected,
				segments);
		}

		// draw instanced tick
		renderInstancedTick(
			this.gl,
			this.atlas,
			shader,
			projection,
			this.getRenderables(),
			this.outlineColor);

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(this.layer.opacity);
		return this;
	}
}

module.exports = Community;
