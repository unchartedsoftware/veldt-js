'use strict';

const lumo = require('lumo');
const BrightnessTransform = require('../shader/BrightnessTransform');

const INDIVIDUAL_SHADER = {
	common: BrightnessTransform.common,
	vert:
		`
		precision highp float;
		attribute vec2 aPosition;
		uniform vec2 uTileOffset;
		uniform vec2 uOffset;
		uniform float uScale;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uScale) + uTileOffset + uOffset;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		`
		precision highp float;
		uniform vec4 uColor;
		uniform float uOpacity;
		void main() {
			vec4 color = brightnessTransform(uColor);
			gl_FragColor = vec4(color.rgb, color.a * uOpacity);
		}
		`
};

const INSTANCED_SHADER = {
	common: BrightnessTransform.common,
	vert:
		`
		precision highp float;
		attribute vec2 aPosition;
		attribute vec2 aOffset;
		uniform vec2 uTileOffset;
		uniform vec2 uOffset;
		uniform float uScale;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = ((aPosition + aOffset) * uScale) + uTileOffset + uOffset;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		`
		precision highp float;
		uniform float uOpacity;
		uniform vec4 uColor;
		void main() {
			vec4 color = brightnessTransform(uColor);
			gl_FragColor = vec4(color.rgb, color.a * uOpacity);
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
			instanced: renderer.createShader(INSTANCED_SHADER),
			individual: renderer.createShader(INDIVIDUAL_SHADER)
		};
	}
	drawInstanced(atlas, color, opacity = 1, offset = [0,0]) {

		const shader = this.shaders.instanced;
		const ring = this.ring;
		const renderer = this.renderer;
		const projection = renderer.getOrthoMatrix();
		const renderables = renderer.getRenderables();

		// use shader
		shader.use();

		// set uniforms
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uOpacity', opacity);
		shader.setUniform('uOffset', offset);
		shader.setUniform('uColor', color);
		shader.setUniform('uBrightness', renderer.brightness);

		// bind the ring buffer
		ring.bind();

		// binds instance offset buffer
		atlas.bindInstanced();

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
	}
	drawIndividual(target, color, opacity = 1, offset = [0, 0]) {

		const shader = this.shaders.individual;
		const ring = this.ring;
		const renderer = this.renderer;
		const plot = renderer.layer.plot;
		const projection = renderer.getOrthoMatrix();
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
		shader.setUniform('uColor', color);
		shader.setUniform('uOpacity', opacity);
		shader.setUniform('uScale', scale);
		shader.setUniform('uTileOffset', tileOffset);
		shader.setUniform('uOffset', offset);
		shader.setUniform('uBrightness', renderer.brightness);

		// bind the ring buffer
		ring.bind();
		// draw ring
		ring.draw();
		// unbind the ring buffer
		ring.unbind();
	}
}

module.exports = Quad;
