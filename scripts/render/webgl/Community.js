'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const Shaders = require('./Shaders');

const NUM_SEGMENTS = 64;
const RADIUS_OFFSET = 10;

const createRing = function(gl, numSegments, radius, ringWidth) {
	const theta = (2 * Math.PI) / numSegments;
	// pre-calculate sine and cosine
	const c = Math.cos(theta);
	const s = Math.sin(theta);
	// start at angle = 0
	let x0 = 0;
	let y0 = radius - (ringWidth / 2);
	let x1 = 0;
	let y1 = radius + (ringWidth / 2);
	const vertices = new Float32Array((numSegments + 1) * (2 + 2));
	for (let i = 0; i <= numSegments; i++) {
		vertices[i*4] = x0;
		vertices[i*4+1] = y0;
		vertices[i*4+2] = x1;
		vertices[i*4+3] = y1;
		// apply the rotation
		let t = x0;
		x0 = c * x0 - s * y0;
		y0 = s * t + c * y0;
		t = x1;
		x1 = c * x1 - s * y1;
		y1 = s * t + c * y1;
	}
	return new lumo.VertexBuffer(
		gl,
		vertices,
		{
			// x, y
			0: {
				size: 2,
				type: 'FLOAT'
			}
		}, {
			mode: 'TRIANGLE_STRIP',
			count: vertices.length / 2
		});
};

/*
const renderTiles = function(shader, ring, ding, atlas, proj, renderables, color, opacity) {
	// use shader
	shader.use();

	// set uniforms
	shader.setUniform('uProjectionMatrix', proj);
	shader.setUniform('uColor', color);
	shader.setUniform('uOpacity', opacity);
	shader.setUniform('uRadiusOffset', RADIUS_OFFSET);

	// bind the ring buffer
	ring.bind();

	// binds instance offset buffer
	atlas.bindInstanced();

	// for each renderable
	renderables.forEach(renderable => {
		// set tile uniforms
		shader.setUniform('uScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);
		// draw the instances
		atlas.drawInstanced(renderable.hash, ring.mode, ring.count);
	});

	// unbind instance offset buffer
	atlas.unbindInstanced();

	// unbind the ring buffer
	ring.unbind();
};
*/

const renderTiles = function(shader, fill, outline, atlas, proj, renderables, color, outlineColor, opacity) {
	// use shader
	shader.use();

	// set uniforms
	shader.setUniform('uProjectionMatrix', proj);
	shader.setUniform('uRadiusOffset', RADIUS_OFFSET);
	shader.setUniform('uOpacity', opacity);

	/*
	 * Draw outlineWidth
	 */

	// bind the ring buffer
	outline.bind();

	// binds instance offset buffer
	atlas.bindInstanced();

	// set color
	shader.setUniform('uColor', outlineColor);

	renderables.forEach(renderable => {
		// set tile uniforms
		shader.setUniform('uScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);
		// draw the instances
		atlas.drawInstanced(renderable.hash, outline.mode, outline.count);
	});

	// unbind instance offset buffer
	atlas.unbindInstanced();

	// unbind the ring buffer
	outline.unbind();

	/*
	 * Draw fill
	 */

	// bind the ring buffer
	fill.bind();

	// binds instance offset buffer
	atlas.bindInstanced();

	// set color
	shader.setUniform('uColor', color);

	// for each renderable
	renderables.forEach(renderable => {
		// set tile uniforms
		shader.setUniform('uScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);
		// draw the instances
		atlas.drawInstanced(renderable.hash, fill.mode, fill.count);
	});

	// unbind instance offset buffer
	atlas.unbindInstanced();

	// unbind the ring buffer
	fill.unbind();
};

const renderRing = function(shader, fill, proj, plot, target, color, opacity) {

	// get tile offset
	const coord = target.tile.coord;
	const scale = Math.pow(2, plot.zoom - coord.z);
	const tileOffset = [
		(coord.x * scale * plot.tileSize) + (scale * target.x) - plot.viewport.x,
		(coord.y * scale * plot.tileSize) + (scale * target.y) - plot.viewport.y
	];

	// use shader
	shader.use();

	// set uniforms
	shader.setUniform('uProjectionMatrix', proj);
	shader.setUniform('uColor', color);
	shader.setUniform('uOpacity', opacity);
	shader.setUniform('uRadius', target.radius);
	shader.setUniform('uRadiusOffset', RADIUS_OFFSET);
	shader.setUniform('uScale', scale);
	shader.setUniform('uTileOffset', tileOffset);

	// bind the ring buffer
	fill.bind();
	// draw ring
	fill.draw();
	// unbind the ring buffer
	fill.unbind();
};

class Community extends lumo.WebGLInteractiveRenderer {

	constructor(options = {}) {
		super(options);
		this.shader = null;
		this.instancedShader = null;
		this.ringFill = null;
		this.ringOutline = null;
		this.atlas = null;
		this.color = defaultTo(options.color, [ 1.0, 1.0, 1.0, 1.0 ]);
		this.outlineColor = defaultTo(options.outlineColor, [ 0.0, 0.0, 0.0, 1.0 ]);
		this.highlightedColor = defaultTo(options.highlightedColor, [ 1.0, 0.5, 1.0, 0.8 ]);
		this.selectedColor = defaultTo(options.selectedColor, [ 1.0, 0.5, 1.0, 0.8 ]);
		this.ringWidth = defaultTo(options.ringWidth, 2);
		this.outlineWidth = defaultTo(options.outlineWidth, 1);
		this.radiusField = defaultTo(options.radiusField, 'radius');
	}

	onAdd(layer) {
		super.onAdd(layer);
		// geometry
		this.ringFill = createRing(
			this.gl,
			NUM_SEGMENTS,
			RADIUS_OFFSET,
			this.ringWidth);
		this.ringOutline = createRing(
			this.gl,
			NUM_SEGMENTS,
			RADIUS_OFFSET,
			this.ringWidth + (this.outlineWidth * 2));
		// shaders
		this.shader = this.createShader(Shaders.ring);
		this.instancedShader = this.createShader(Shaders.instancedRing);
		// offset atlas
		this.atlas = this.createVertexAtlas({
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
		});
		return this;
	}

	onRemove(layer) {
		this.destroyVertexAtlas(this.atlas);
		this.shader = null;
		this.instancedShader = null;
		this.atlas = null;
		this.ringFill = null;
		this.ringOutline = null;
		super.onRemove(layer);
		return this;
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
		const outlineOffset = this.outlineWidth;

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

	draw() {

		const gl = this.gl;
		const layer = this.layer;
		const plot = layer.plot;
		const proj = this.getOrthoMatrix();

		// // bind render target
		// plot.renderBuffer.bind();
		// plot.renderBuffer.clear();

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		renderTiles(
			this.instancedShader,
			this.ringFill,
			this.ringOutline,
			this.atlas,
			proj,
			this.getRenderables(),
			this.color,
			this.outlineColor,
			layer.opacity);

		// render selected
		if (this.selected) {
			renderRing(
				this.shader,
				this.ringFill,
				proj,
				plot,
				this.selected,
				this.selectedColor,
				layer.opacity);
		}

		// render highlighted
		if (this.highlighted && this.highlighted !== this.selected) {
			renderRing(
				this.shader,
				this.ringFill,
				proj,
				plot,
				this.highlighted,
				this.highlightedColor,
				layer.opacity);
		}

		// // unbind render target
		// plot.renderBuffer.unbind();
		//
		// // render framebuffer to the backbuffer
		// plot.renderBuffer.blitToScreen(this.layer.opacity);

		return this;
	}

}

module.exports = Community;
