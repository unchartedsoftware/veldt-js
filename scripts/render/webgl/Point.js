'use strict';

const get = require('lodash/get');
const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const Shaders = require('./Shaders');

const POINT_RADIUS = 8;
const POINT_RADIUS_INC = 2;

const createPoint = function(gl) {
	const vertices = new Float32Array(2);
	vertices[0] = 0.0;
	vertices[1] = 0.0;
	// create quad buffer
	return new lumo.VertexBuffer(
		gl,
		vertices,
		{
			0: {
				size: 2,
				type: 'FLOAT',
				byteOffset: 0
			}
		},
		{
			mode: 'POINTS',
			count: 1
		});
};

const renderTiles = function(gl, atlas, shader, proj, renderables, color) {

	// clear render target
	gl.clear(gl.COLOR_BUFFER_BIT);

	// set blending func
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

	shader.setUniform('uColor', color);
	shader.setUniform('uRadiusOffset', 0);

	// binds the buffer to instance
	atlas.bind();

	// for each renderable
	renderables.forEach(renderable => {
		shader.setUniform('uTileScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);
		atlas.draw(renderable.hash, 'POINTS');
	});

	// unbind
	atlas.unbind();
};

const renderPoint = function(gl, point, shader, proj, plot, target, color, radiusOffset) {

	// get tile offset
	const coord = target.tile.coord;
	const scale = Math.pow(2, plot.zoom - coord.z);
	const tileOffset = [
		(coord.x * scale * plot.tileSize) + (scale * target.x) - plot.viewport.x,
		(coord.y * scale * plot.tileSize) + (scale * target.y) - plot.viewport.y
	];
	shader.setUniform('uTileOffset', tileOffset);
	shader.setUniform('uTileScale', scale);
	shader.setUniform('uColor', color);
	shader.setUniform('uRadiusOffset', radiusOffset + target.radius);

	// binds the buffer to instance
	point.bind();

	// draw the points
	point.draw();

	// unbind
	point.unbind();
};

const applyJitter = function(point, maxDist) {
	const angle = Math.random() * (Math.PI * 2);
	const dist = Math.random() * maxDist;
	point.x += Math.floor(Math.cos(angle) * dist);
	point.y += Math.floor(Math.sin(angle) * dist);
};

const addTile = function(renderer, event) {
	const tile = event.tile;
	const coord = tile.coord;
	const data = tile.data;

	const tileSize = renderer.layer.plot.tileSize;
	const xOffset = coord.x * tileSize;
	const yOffset = coord.y * tileSize;

	const xField = renderer.xField;
	const yField = renderer.yField;
	const radius = renderer.radius;

	const points = new Array(data.length);
	const vertices = new Float32Array(data.length * 2);

	const collisions = {};

	for (let i=0; i<data.length; i++) {
		const datum = data[i];

		const px = {
			x: get(datum, xField),
			y: get(datum, yField)
		};

		// add jitter if specified
		if (renderer.jitter) {
			const hash = `${px.x}:${px.y}`;
			if (collisions[hash]) {
				applyJitter(px, renderer.jitterDistance);
			}
			collisions[hash] = true;
		}

		const plotPx = {
			x: px.x + xOffset,
			y: px.y + yOffset
		};

		vertices[i*2] = px.x;
		vertices[i*2+1] = px.y;

		points[i] = {
			x: px.x,
			y: px.y,
			minX: plotPx.x - radius,
			maxX: plotPx.x + radius,
			minY: plotPx.y - radius,
			maxY: plotPx.y + radius,
			tile: tile,
			data: datum
		};
	}

	renderer.addPoints(coord, points);
	renderer.atlas.set(coord.hash, vertices, points.length);
};

const removeTile = function(renderer, event) {
	const tile = event.tile;
	const coord = tile.coord;
	renderer.atlas.delete(coord.hash);
	renderer.removePoints(coord);
};

class Point extends lumo.WebGLIneractiveRenderer {

	constructor(options = {}) {
		super();
		this.shader = null;
		this.point = null;
		this.atlas = null;
		this.xField = defaultTo(options.xField, 'x');
		this.yField = defaultTo(options.yField, 'y');
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.radius = defaultTo(options.radius, POINT_RADIUS);
		this.jitter = defaultTo(options.radius, true);
		this.jitterDistance = defaultTo(options.jitterDistance, 10);
	}

	onAdd(layer) {
		super.onAdd(layer);

		// get the extension for standard derivatives
		this.ext = this.gl.getExtension('OES_standard_derivatives');

		this.shader = new lumo.Shader(this.gl, Shaders.Point);

		this.point = createPoint(this.gl);
		this.atlas = new lumo.VertexAtlas(
			this.gl,
			{
				0: {
					size: 2,
					type: 'FLOAT'
				},
				1: {
					size: 1,
					type: 'FLOAT'
				}
			}, {
				// set num chunks to be able to fit the capacity of the pyramid
				numChunks: layer.pyramid.totalCapacity
			});

		this.tileAdd = event => {
			addTile(this, event);
		};

		this.tileRemove = event => {
			removeTile(this, event);
		};

		layer.on(lumo.TILE_ADD, this.tileAdd);
		layer.on(lumo.TILE_REMOVE, this.tileRemove);

		return this;
	}

	onRemove(layer) {
		this.layer.removeListener(this.tileAdd);
		this.layer.removeListener(this.tileRemove);
		this.tileAdd = null;
		this.tileRemove = null;

		this.shader = null;

		this.atlas = null;
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

		// use shader
		shader.use();

		// set uniforms
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uPixelRatio', window.devicePixelRatio);

		// render the tiles
		renderTiles(
			this.gl,
			this.atlas,
			shader,
			projection,
			this.getRenderables(),
			this.color);

		// render selected
		if (this.selected) {
			renderPoint(
				this.gl,
				this.point,
				shader,
				projection,
				plot,
				this.selected,
				this.color,
				POINT_RADIUS_INC * 2);
		}

		// render highlighted
		if (this.highlighted && this.highlighted !== this.selected) {
			renderPoint(
				this.gl,
				this.point,
				shader,
				projection,
				plot,
				this.highlighted,
				this.color,
				POINT_RADIUS_INC);
		}

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(this.layer.opacity);
		return this;
	}

}

module.exports = Point;
