'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const Shaders = require('./Shaders');

const createPoint = function(gl) {
	const vertices = new Float32Array(2);
	vertices[0] = 0.0;
	vertices[1] = 0.0;
	vertices[2] = 0.0;
	// create quad buffer
	return new lumo.VertexBuffer(
		gl,
		vertices,
		{
			// position
			0: {
				size: 2,
				type: 'FLOAT'
			},
			// radius
			1: {
				size: 1,
				type: 'FLOAT'
			}
		},
		{
			mode: 'POINTS',
			count: 1
		});
};

const renderTiles = function(gl, shader, atlas, plot, layer, proj, renderables, color) {

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
		// set tile uniforms
		shader.setUniform('uScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);
		// draw the points
		atlas.draw(renderable.hash, 'POINTS');
	});

	// unbind
	atlas.unbind();
};

const renderPoint = function(gl, point, shader, proj, plot, target, color) {

	// get tile offset
	const coord = target.tile.coord;
	const scale = Math.pow(2, plot.zoom - coord.z);
	const tileOffset = [
		(coord.x * scale * plot.tileSize) + (scale * target.x) - plot.viewport.x,
		(coord.y * scale * plot.tileSize) + (scale * target.y) - plot.viewport.y
	];
	shader.setUniform('uColor', color);
	shader.setUniform('uScale', scale);
	shader.setUniform('uTileOffset', tileOffset);
	shader.setUniform('uRadiusOffset', target.radius);

	// binds the buffer to instance
	point.bind();

	// draw the points
	point.draw();

	// unbind
	point.unbind();
};

class Community extends lumo.WebGLInteractiveRenderer {

	constructor(options = {}) {
		super(options);
		this.shader = null;
		this.point = null;
		this.atlas = null;
		this.color = defaultTo(options.color, [ 1.0, 1.0, 1.0, 0.8 ]);
		this.highlightedColor = defaultTo(options.highlightedColor, [ 1.0, 0.5, 1.0, 0.8 ]);
		this.selectedColor = defaultTo(options.selectedColor, [ 1.0, 0.5, 1.0, 0.8 ]);
		this.outline = defaultTo(options.outline, 2);
		this.radiusField = defaultTo(options.radiusField, 'radius');
	}

	addTile(atlas, tile) {
		const coord = tile.coord;
		const data = tile.data;
		const hits = data.hits;
		const positions = data.points;

		const tileSize = this.layer.plot.tileSize;
		const xOffset = coord.x * tileSize;
		const yOffset = coord.y * tileSize;
		const radiusField = this.radiusField;

		const radiusScale = Math.pow(2, coord.z);
		const outlineOffset = this.outline;

		const points = new Array(positions.length / 2);
		const vertices = new Float32Array((positions.length / 2) * 3);

		for (let i=0; i<positions.length/2; i++) {

			const hit = hits[i];
			const x = positions[i*2];
			const y = positions[i*2+1];
			const radius = hit[radiusField] * radiusScale + outlineOffset;

			// plot pixel coords
			const px = x + xOffset;
			const py = y + yOffset;

			points[i] = {
				x: x,
				y: y,
				radius: radius,
				minX: px - radius,
				maxX: px + radius,
				minY: py - radius,
				maxY: py + radius,
				tile: tile,
				data: hit
			};

			vertices[i*3] = x;
			vertices[i*3+1] = y;
			vertices[i*3+2] = radius;
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
		this.shader = this.createShader(Shaders.communityRing);
		this.atlas = this.createVertexAtlas({
			// position
			0: {
				size: 2,
				type: 'FLOAT'
			},
			// radius
			1: {
				size: 1,
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

		const layer = this.layer;
		const plot = layer.plot;
		const proj = this.getOrthoMatrix();
		const shader = this.shader;

		// bind render target
		plot.renderBuffer.bind();

		// use shader
		shader.use();

		// set uniforms
		shader.setUniform('uProjectionMatrix', proj);
		shader.setUniform('uPixelRatio', plot.pixelRatio);

		// render the tiles
		renderTiles(
			this.gl,
			shader,
			this.atlas,
			plot,
			layer,
			proj,
			this.getRenderables(),
			this.color);

		// render selected
		if (this.selected) {
			renderPoint(
				this.gl,
				this.point,
				shader,
				proj,
				plot,
				this.selected,
				this.selectedColor);
		}

		// render highlighted
		if (this.highlighted && this.highlighted !== this.selected) {
			renderPoint(
				this.gl,
				this.point,
				shader,
				proj,
				plot,
				this.highlighted,
				this.highlightedColor);
		}

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(this.layer.opacity);
		return this;
	}

}

module.exports = Community;
