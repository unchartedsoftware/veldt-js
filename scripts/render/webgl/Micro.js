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


class Micro extends lumo.WebGLInteractiveRenderer {

	constructor(options = {}) {
		super(options);
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

	addTile(atlas, tile) {
		const coord = tile.coord;
		const data = tile.data;

		const tileSize = this.layer.plot.tileSize;
		const xOffset = coord.x * tileSize;
		const yOffset = coord.y * tileSize;

		const xField = this.xField;
		const yField = this.yField;
		const radius = this.radius;

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
			if (this.jitter) {
				const hash = `${px.x}:${px.y}`;
				if (collisions[hash]) {
					applyJitter(px, this.jitterDistance);
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
		// get the extension for standard derivatives
		this.ext = this.gl.getExtension('OES_standard_derivatives');
		this.point = createPoint(this.gl);
		this.shader = this.createShader(Shaders.micro);
		this.atlas = this.createVertexAtlas({
			// position
			0: {
				size: 2,
				type: 'FLOAT'
			}
		});
		return this;
	}

	onRemove(layer) {
		this.destroyVertexAtlas(this.atlas);
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

module.exports = Micro;
