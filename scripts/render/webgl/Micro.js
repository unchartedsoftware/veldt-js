'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const morton = require('../morton/Morton');
const Shaders = require('./Shaders');

const POINT_RADIUS = 8;
const POINT_RADIUS_INC = 4;

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

const getOffsetIndices = function(x, y, extent, lod) {
	const partitions = Math.pow(2, lod);
	const xcell = x * partitions;
	const ycell = y * partitions;
	const stride = extent * partitions;
	const start = morton(xcell, ycell);
	const stop = start + (stride * stride);
	return [ start, stop ];
};

const draw = function(gl, shader, atlas, renderables) {
	// for each renderable
	renderables.forEach(renderable => {
		// set tile uniforms
		shader.setUniform('uScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);
		shader.setUniform('uLODScale', 1);
		shader.setUniform('uLODOffset', [0, 0]);
		// draw the points
		atlas.draw(renderable.hash, 'POINTS');
	});
};

const drawLOD = function(gl, shader, atlas, plot, lod, renderables) {
	const zoom = Math.round(plot.zoom);
	// for each renderable
	renderables.forEach(renderable => {

		// distance between actual zoom and the LOD of tile
		const dist = Math.abs(renderable.tile.coord.z - zoom);

		if (dist > lod) {
			// not even lod to support it
			return;
		}

		const xOffset = renderable.uvOffset[0];
		const yOffset = renderable.uvOffset[1];
		const extent = renderable.uvOffset[3];

		// set tile uniforms
		shader.setUniform('uScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);

		const lodScale = 1 / extent;

		const lodOffset = [
			-(xOffset * lodScale * plot.tileSize),
			-(yOffset * lodScale * plot.tileSize)];

		shader.setUniform('uLODScale', 1 / extent);
		shader.setUniform('uLODOffset', lodOffset);
		// get byte offset and count
		const [ start, stop ] = getOffsetIndices(
			xOffset,
			yOffset,
			extent,
			lod);

		const points = renderable.tile.data.points;
		const offsets = renderable.tile.data.offsets;

		const startByte = offsets[start];
		const stopByte = (stop === offsets.length) ? points.byteLength : offsets[stop];

		const offset = startByte / (atlas.stride * 4);
		const count = (stopByte - startByte) / (atlas.stride * 4);
		if (count > 0) {
			// draw the points
			atlas.draw(renderable.hash, 'POINTS', offset, count);
		}
	});
};

const renderTiles = function(gl, shader, atlas, plot, layer, proj, renderables, color, radius) {

	// clear render target
	gl.clear(gl.COLOR_BUFFER_BIT);

	// set blending func
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

	shader.setUniform('uColor', color);
	shader.setUniform('uRadius', radius);

	// binds the buffer to instance
	atlas.bind();

	if (layer.lod > 0) {
		drawLOD(gl, shader, atlas, plot, layer.lod, renderables);
	} else {
		draw(gl, shader, atlas, renderables);
	}

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
	shader.setUniform('uScale', scale);
	shader.setUniform('uColor', color);
	shader.setUniform('uRadius', radiusOffset + target.radius);

	// binds the buffer to instance
	point.bind();

	// draw the points
	point.draw();

	// unbind
	point.unbind();
};

// const applyJitter = function(point, maxDist) {
// 	const angle = Math.random() * (Math.PI * 2);
// 	const dist = Math.random() * maxDist;
// 	point.x += Math.floor(Math.cos(angle) * dist);
// 	point.y += Math.floor(Math.sin(angle) * dist);
// };

class Micro extends lumo.WebGLInteractiveRenderer {

	constructor(options = {}) {
		super(options);
		this.shader = null;
		this.point = null;
		this.atlas = null;
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.radius = defaultTo(options.radius, POINT_RADIUS);
		// this.jitter = defaultTo(options.radius, true);
		// this.jitterDistance = defaultTo(options.jitterDistance, 10);
	}

	addTile(atlas, tile) {
		const coord = tile.coord;
		const data = tile.data;
		const hits = data.hits;
		const vertices = data.points;

		const tileSize = this.layer.plot.tileSize;
		const xOffset = coord.x * tileSize;
		const yOffset = coord.y * tileSize;
		const radius = this.radius;

		const points = new Array(vertices.length / 2);

		// const collisions = {};

		for (let i=0; i<vertices.length / 2; i++) {

			const x = vertices[i*2];
			const y = vertices[i*2+1];

			// add jitter if specified
			// if (this.jitter) {
			// 	const hash = `${px.x}:${px.y}`;
			// 	if (collisions[hash]) {
			// 		applyJitter(px, this.jitterDistance);
			// 	}
			// 	collisions[hash] = true;
			// }

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
				data: hits ? hits[i] : null
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
			layer.lod > 0 ? this.getRenderablesLOD() : this.getRenderables(),
			this.color,
			this.radius);

		// render selected
		if (this.selected) {
			renderPoint(
				this.gl,
				this.point,
				shader,
				proj,
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
				proj,
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
