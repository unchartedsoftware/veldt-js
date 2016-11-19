'use strict';

const _ = require('lodash');
const lumo = require('lumo');
const ColorRamp = require('../color/ColorRamp');
const Shaders = require('./Shaders');

function encodeTexture(data) {
	const counts = new Float64Array(data);
	const bins = new Uint8Array(counts.length * 4);
	let bin = 0;
	for (let i=0; i<counts.length; i++) {
		bin = counts[i];
		bins[i * 4] = (bin / 16777216.0) & 0xFF;
		bins[i * 4 + 1] = (bin / 65536.0) & 0xFF;
		bins[i * 4 + 2] = (bin / 256.0) & 0xFF;
		bins[i * 4 + 3] = bin & 0xFF;
	}
	return bins;
}

const createQuad = function(gl, size) {
	const vertices = new Float32Array(24);
	// positions
	vertices[0] = 0;	   vertices[1] = 0;
	vertices[2] = size;	   vertices[3] = 0;
	vertices[4] = size;	   vertices[5] = size;
	vertices[6] = 0;	   vertices[7] = 0;
	vertices[8] = size;	   vertices[9] = size;
	vertices[10] = 0;	   vertices[11] = size;
	// uvs
	vertices[12] = 0;	   vertices[13] = 0;
	vertices[14] = 1;	   vertices[15] = 0;
	vertices[16] = 1;	   vertices[17] = 1;
	vertices[18] = 0;	   vertices[19] = 0;
	vertices[20] = 1;	   vertices[21] = 1;
	vertices[22] = 0;	   vertices[23] = 1;
	// create quad buffer
	return new lumo.VertexBuffer(
		gl,
		vertices,
		{
			0: {
				size: 2,
				type: 'FLOAT',
				byteOffset: 0
			},
			1: {
				size: 2,
				type: 'FLOAT',
				byteOffset: 2 * 6 * 4
			}
		},
		{
			count: 6,
		});
};

class Heatmap extends lumo.WebGLTextureRenderer {

	constructor(options = {}) {
		super(options);
		this.transform = _.defaultTo(options.transform, 'log10');
		this.colorRamp = _.defaultTo(options.colorRamp, 'verdant');
		this.quad = null;
		this.shader = null;
		this.array = null;
	}

	addTile(array, tile) {
		const encoded = encodeTexture(tile.data);
		array.set(tile.coord.hash, encoded);
	}

	removeTile(array, tile) {
		array.delete(tile.coord.hash);
	}

	onAdd(layer) {
		super.onAdd(layer);
		this.quad = createQuad(this.gl, 0, layer.plot.tileSize);
		this.shader = this.createShader(Shaders.heatmap);
		this.array = this.createTextureArray(layer.resolution);
		return this;
	}

	onRemove(layer) {
		this.destroyTextureArray(this.array);
		this.quad = null;
		this.shader = null;
		this.array = null;
		super.onRemove(layer);
		return this;
	}

	draw() {
		const gl = this.gl;
		const shader = this.shader;
		const array = this.array;
		const quad = this.quad;
		const renderables = this.getRenderablesLOD();
		const proj = this.getOrthoMatrix();

		// bind shader
		shader.use();

		// set uniforms
		shader.setUniform('uProjectionMatrix', proj);
		//shader.setUniform('uTextureSampler', 0);
		//shader.setUniform('uOpacity', this.layer.opacity);
		//shader.setUniform('uRangeMin', 0); //this.getValueRange().min);
		//shader.setUniform('uRangeMax', 1); //this.getValueRange().max);
		//shader.setUniform('uMin', this.layer.getExtrema().min);
		//shader.setUniform('uMax', this.layer.getExtrema().max);
		//shader.setUniform('uTransformType', 0); //this.getTransformEnum(this.transform));
		//shader.setUniform('uColorRamp', ColorRamp.getTable(this.colorRamp));

		// set blending func
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// bind quad
		quad.bind();

		let last;
		// for each renderable
		renderables.forEach(renderable => {
			const hash = renderable.hash;
			if (last !== hash) {
				// bind texture
				array.bind(hash, 0);
				last = hash;
			}
			// set tile uniforms
			shader.setUniform('uTextureCoordOffset', renderable.uvOffset);
			shader.setUniform('uScale', renderable.scale);
			shader.setUniform('uTileOffset', renderable.tileOffset);
			// draw
			quad.draw();
			// no need to unbind texture
		});

		// unbind quad
		quad.unbind();
		return this;
	}
}

module.exports = Heatmap;
