'use strict';

const lumo = require('lumo');
const BrightnessTransform = require('../shader/BrightnessTransform');

const NUM_SEGMENTS = 64;
const RADIUS_OFFSET = 64;

const INDIVIDUAL_SHADER = {
	common: BrightnessTransform.common,
	vert:
		`
		attribute vec2 aPosition;
		uniform float uRadius;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform float uRadiusOffset;
		uniform mat4 uProjectionMatrix;
		uniform vec4 uColor;
		uniform float uOpacity;
		varying vec4 vColor;
		void main() {
			vec2 radiusOffset = normalize(aPosition) * (uRadius - uRadiusOffset);
			vec2 wPosition = ((aPosition + radiusOffset) * uScale) + uTileOffset;
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

const INSTANCED_SHADER = {
	common: BrightnessTransform.common,
	vert:
		`
		attribute vec2 aPosition;
		attribute vec2 aOffset;
		attribute float aRadius;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform float uRadiusOffset;
		uniform mat4 uProjectionMatrix;
		uniform vec4 uColor;
		uniform float uOpacity;
		varying vec4 vColor;
		void main() {
			vec2 radiusOffset = normalize(aPosition) * (aRadius - uRadiusOffset);
			vec2 wPosition = ((aPosition + radiusOffset + aOffset) * uScale) + uTileOffset;
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

class Ring {
	constructor(renderer, width) {
		this.renderer = renderer;
		this.ring = createRing(
			renderer.gl,
			NUM_SEGMENTS,
			RADIUS_OFFSET,
			width);
		this.shaders = {
			instanced: renderer.createShader(INSTANCED_SHADER),
			individual: renderer.createShader(INDIVIDUAL_SHADER)
		};
	}
	drawInstanced(atlas, color, opacity = 1) {

		const shader = this.shaders.instanced;
		const ring = this.ring;
		const renderer = this.renderer;
		const projection = renderer.getOrthoMatrix();
		const renderables = renderer.getRenderables();

		// use shader
		shader.use();

		// set uniforms
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uRadiusOffset', RADIUS_OFFSET);
		shader.setUniform('uOpacity', opacity);
		shader.setUniform('uColor', color);
		shader.setUniform('uBrightness', renderer.brightness);

		// bind the ring buffer
		ring.bind();

		// binds instance offset buffer
		atlas.bindInstanced();

		for (let i=0; i<renderables.length; i++) {
			const renderable = renderables[i];
			// set tile uniforms
			shader.setUniform('uScale', renderable.scale);
			shader.setUniform('uTileOffset', renderable.tileOffset);
			// draw the instances
			atlas.drawInstanced(renderable.hash, ring.mode, ring.count);
		}

		// unbind instance offset buffer
		atlas.unbindInstanced();

		// unbind the ring buffer
		ring.unbind();
	}
	drawIndividual(target, color, opacity = 1) {

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
		shader.setUniform('uRadius', target.radius);
		shader.setUniform('uRadiusOffset', RADIUS_OFFSET);
		shader.setUniform('uScale', scale);
		shader.setUniform('uTileOffset', tileOffset);
		shader.setUniform('uBrightness', renderer.brightness);

		// bind the ring buffer
		ring.bind();
		// draw ring
		ring.draw();
		// unbind the ring buffer
		ring.unbind();
	}
}

module.exports = Ring;
