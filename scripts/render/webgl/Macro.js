'use strict';

const defaultTo = require('lodash/defaultTo');
const lumo = require('lumo');
const morton = require('../morton/Morton');
const Shaders = require('./Shaders');

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

class Macro extends lumo.WebGLVertexRenderer {

	constructor(options = {}) {
		super(options);
		this.shader = null;
		this.atlas = null;
		this.color = defaultTo(options.color, [ 1.0, 0.4, 0.1, 0.8 ]);
		this.radius = defaultTo(options.radius, 2);
	}

	addTile(atlas, tile) {
		const bins = (this.layer.lod > 0) ? tile.data.points : tile.data;
		atlas.set(
			tile.coord.hash,
			bins,
			bins.length / atlas.stride);
	}

	onAdd(layer) {
		super.onAdd(layer);
		// get the extension for standard derivatives
		this.ext = this.gl.getExtension('OES_standard_derivatives');
		this.shader = this.createShader(Shaders.macro);
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
		super.onRemove(layer);
		return this;
	}

	draw() {
		const gl = this.gl;
		const shader = this.shader;
		const atlas = this.atlas;
		const layer = this.layer;
		const plot = layer.plot;
		const proj = this.getOrthoMatrix();

		// bind render target
		plot.renderBuffer.bind();

		// clear render target
		gl.clear(gl.COLOR_BUFFER_BIT);

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

		// bind shader
		shader.use();

		// set global uniforms
		shader.setUniform('uProjectionMatrix', proj);
		shader.setUniform('uColor', this.color);
		shader.setUniform('uRadius', this.radius);
		shader.setUniform('uPixelRatio', plot.pixelRatio);

		// binds the vertex atlas
		atlas.bind();

		if (layer.lod > 0) {
			drawLOD(gl, shader, atlas, plot, layer.lod, this.getRenderablesLOD());
		} else {
			draw(gl, shader, atlas, this.getRenderables());
		}

		// unbind
		atlas.unbind();

		// unbind render target
		plot.renderBuffer.unbind();

		// render framebuffer to the backbuffer
		plot.renderBuffer.blitToScreen(this.layer.opacity);

		return this;
	}
}

module.exports = Macro;
