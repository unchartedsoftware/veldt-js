'use strict';

const lumo = require('lumo');
const BrightnessTransform = require('../shader/BrightnessTransform');

const INSTANCED_SHADER = {
	common: BrightnessTransform.common,
	vert:
		`
		attribute vec2 aPosition;
		attribute vec2 aOffset;
		attribute float aRadius;
		uniform float uRotation;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform mat4 uProjectionMatrix;
		uniform vec4 uColor;
		uniform float uOpacity;
		varying vec4 vColor;
		void main() {
			float s = sin(uRotation);
			float c = cos(uRotation);
			mat2 rotation = mat2(c, -s, s, c);
			vec2 radiusOffset = aRadius * vec2(0.0, 1.0);
			vec2 wPosition = ((rotation * (aPosition + radiusOffset)) + aOffset) * uScale + uTileOffset;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
			vColor = brightnessTransform(vec4(uColor.rgb, uColor.a * uOpacity));
		}
		`,
	frag:
		`
		varying vec4 vColor;
		void main() {
			gl_FragColor = vColor;
		}
		`
};

const createQuad = function(gl, left, right, bottom, top) {
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
		gl,
		vertices,
		{
			0: {
				size: 2,
				type: 'FLOAT'
			}
		},
		{
			count: 6,
		});
};

class Quad {
	constructor(renderer, left, right, bottom, top) {
		this.renderer = renderer;
		this.quad = createQuad(renderer.gl, left, right, bottom, top);
		this.shaders = {
			instanced: renderer.createShader(INSTANCED_SHADER)
		};
	}
	drawInstanced(atlas, color, rotation = 0, opacity = 1) {

		const shader = this.shaders.instanced;
		const quad = this.quad;
		const renderer = this.renderer;
		const projection = renderer.getOrthoMatrix();
		const renderables = renderer.getRenderables();

		// use shader
		shader.use();

		// set uniforms
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uRotation', rotation);
		shader.setUniform('uOpacity', opacity);
		shader.setUniform('uColor', color);
		shader.setUniform('uBrightness', renderer.brightness);

		// bind the quad buffer
		quad.bind();

		// binds instance offset buffer
		atlas.bindInstanced();

		for (let i=0; i<renderables.length; i++) {
			const renderable = renderables[i];
			// set tile uniforms
			shader.setUniform('uScale', renderable.scale);
			shader.setUniform('uTileOffset', renderable.tileOffset);
			// draw the instances
			atlas.drawInstanced(renderable.hash, quad.mode, quad.count);
		}

		// unbind instance offset buffer
		atlas.unbindInstanced();

		// unbind the quad buffer
		quad.unbind();
	}
	drawIndividual(target, color, rotation, opacity = 1) {
		const shader = this.shaders.individual;
		const quad = this.quad;
		const renderer = this.renderer;
		const plot = this.renderer.layer.plot;
		const projection = this.renderer.getOrthoMatrix();
		const viewport = plot.getViewportPixelOffset();

		// get tile offset
		const coord = target.tile.coord;
		const scale = Math.pow(2, plot.zoom - coord.z);
		const tileOffset = [
			(coord.x * scale * plot.tileSize) + (scale * target.x) - viewport.x,
			(coord.y * scale * plot.tileSize) + (scale * target.y) - viewport.y
		];

		// use shader
		shader.use();

		// set uniforms
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uRotation', rotation);
		shader.setUniform('uOpacity', opacity);
		shader.setUniform('uColor', color);
		shader.setUniform('uScale', scale);
		shader.setUniform('uTileOffset', tileOffset);
		shader.setUniform('uBrightness', renderer.brightness);

		// bind the quad buffer
		quad.bind();
		// draw quad
		quad.draw();
		// unbind the quad buffer
		quad.unbind();
	}
}

module.exports = Quad;
