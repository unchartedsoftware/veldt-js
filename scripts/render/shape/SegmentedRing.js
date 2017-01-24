'use strict';

const lumo = require('lumo');

const NUM_SLICES = 360;
const RADIUS_OFFSET = 10;

const INDIVIDUAL_SHADER = {
	vert:
		`
		precision highp float;
		attribute vec3 aPosition;

		uniform float uPercentages[NUM_SEGMENTS];
		uniform vec4 uColors[NUM_SEGMENTS];
		uniform float uRadius;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform float uRadiusOffset;
		uniform mat4 uProjectionMatrix;

		varying vec4 vColor;

		void main() {
			vec2 radiusOffset = normalize(aPosition.xy) * (uRadius - uRadiusOffset);
			vec2 wPosition = ((aPosition.xy + radiusOffset) * uScale) + uTileOffset;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);

			float percentage = aPosition.z;
			for (int i = 0; i<NUM_SEGMENTS; i++) {
				if (percentage <= uPercentages[i]) {
					vColor = uColors[i];
					break;
				}
			}
		}
		`,
	frag:
		`
		precision highp float;
		uniform float uOpacity;
		varying vec4 vColor;
		void main() {
			gl_FragColor = vec4(vColor.rgb, vColor.a * uOpacity);
		}
		`
};

const INSTANCED_SHADER = {
	vert:
		`
		precision highp float;
		attribute vec3 aPosition;
		attribute vec2 aOffset;
		attribute float aRadius;
		attribute vec4 aPercentagesA;
		attribute vec4 aPercentagesB;
		attribute vec4 aPercentagesC;
		attribute vec4 aPercentagesD;

		uniform vec4 uColors[NUM_SEGMENTS];
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform float uRadiusOffset;
		uniform mat4 uProjectionMatrix;

		varying vec4 vColor;

		void main() {
			vec2 radiusOffset = normalize(aPosition.xy) * (aRadius - uRadiusOffset);
			vec2 wPosition = ((aPosition.xy + radiusOffset + aOffset) * uScale) + uTileOffset;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);

			float percentage = aPosition.z;
			if (percentage <= aPercentagesA.x) {
				vColor = uColors[0];
			#if NUM_SEGMENTS > 1
			} else if (percentage <= aPercentagesA.y) {
					vColor = uColors[1];
			#endif
			#if NUM_SEGMENTS > 2
				} else if (percentage <= aPercentagesA.z) {
					vColor = uColors[2];
			#endif
			#if NUM_SEGMENTS > 3
				} else if (percentage <= aPercentagesA.w) {
					vColor = uColors[3];
			#endif
			#if NUM_SEGMENTS > 4
				} else if (percentage <= aPercentagesB.x) {
					vColor = uColors[4];
			#endif
			#if NUM_SEGMENTS > 5
				} else if (percentage <= aPercentagesB.y) {
					vColor = uColors[5];
			#endif
			#if NUM_SEGMENTS > 6
				} else if (percentage <= aPercentagesB.z) {
					vColor = uColors[6];
			#endif
			#if NUM_SEGMENTS > 7
				} else if (percentage <= aPercentagesB.w) {
					vColor = uColors[7];
			#endif
			#if NUM_SEGMENTS > 8
				} else if (percentage <= aPercentagesC.x) {
					vColor = uColors[8];
			#endif
			#if NUM_SEGMENTS > 9
				} else if (percentage <= aPercentagesC.y) {
					vColor = uColors[9];
			#endif
			#if NUM_SEGMENTS > 10
				} else if (percentage <= aPercentagesC.z) {
					vColor = uColors[10];
			#endif
			#if NUM_SEGMENTS > 11
				} else if (percentage <= aPercentagesC.w) {
					vColor = uColors[11];
			#endif
			#if NUM_SEGMENTS > 12
				} else if (percentage <= aPercentagesD.x) {
					vColor = uColors[12];
			#endif
			#if NUM_SEGMENTS > 13
				} else if (percentage <= aPercentagesD.y) {
					vColor = uColors[13];
			#endif
			#if NUM_SEGMENTS > 14
				} else if (percentage <= aPercentagesD.z) {
					vColor = uColors[14];
			#endif
				} else {
					vColor = uColors[NUM_SEGMENTS-1];
				}
			}
		`,
	frag:
		`
		precision highp float;
		uniform float uOpacity;
		varying vec4 vColor;
		void main() {
			gl_FragColor = vec4(vColor.rgb, vColor.a * uOpacity);
		}
		`
};

const createSegmentedRing = function(gl, numSegments, radius, ringWidth) {
	const theta = (2 * Math.PI) / numSegments;
	// pre-calculate sine and cosine
	const c = Math.cos(theta);
	const s = Math.sin(theta);
	// start at angle = 0
	let x0 = 0;
	let y0 = radius - (ringWidth / 2);
	let x1 = 0;
	let y1 = radius + (ringWidth / 2);
	const vertices = new Float32Array((numSegments + 1) * (3 + 3));
	for (let i = 0; i <= numSegments; i++) {
		vertices[i*6] = x0;
		vertices[i*6+1] = y0;
		vertices[i*6+2] = i / (numSegments + 1); // arc percent
		vertices[i*6+3] = x1;
		vertices[i*6+4] = y1;
		vertices[i*6+5] = i / (numSegments + 1); // arc percent
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
			// x, y, percent
			0: {
				size: 3,
				type: 'FLOAT'
			}
		}, {
			mode: 'TRIANGLE_STRIP',
			count: vertices.length / 3
		});
};

class SegmentedRing {
	constructor(renderer, width, numSegments) {
		this.renderer = renderer;
		this.ring = createSegmentedRing(
			renderer.gl,
			NUM_SLICES,
			RADIUS_OFFSET,
			width);
		this.shaders = {
			instanced: renderer.createShader({
				define: {
					NUM_SEGMENTS: numSegments
				},
				vert: INSTANCED_SHADER.vert,
				frag: INSTANCED_SHADER.frag
			}),
			individual: renderer.createShader({
				define: {
					NUM_SEGMENTS: numSegments
				},
				vert: INDIVIDUAL_SHADER.vert,
				frag: INDIVIDUAL_SHADER.frag
			})
		};
	}
	drawInstanced(atlas, colors, opacity = 1) {

		const shader = this.shaders.instanced;
		const ring = this.ring;
		const projection = this.renderer.getOrthoMatrix();
		const renderables = this.renderer.getRenderables();

		// use shader
		shader.use();

		// set uniforms
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uRadiusOffset', RADIUS_OFFSET);
		shader.setUniform('uOpacity', opacity);
		shader.setUniform('uColors', colors);

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
	drawIndividual(target, colors, opacity = 1) {

		const shader = this.shaders.individual;
		const ring = this.ring;
		const plot = this.renderer.layer.plot;
		const projection = this.renderer.getOrthoMatrix();

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
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uColors', colors);
		shader.setUniform('uPercentages', target.percentages);
		shader.setUniform('uOpacity', opacity);
		shader.setUniform('uRadius', target.radius);
		shader.setUniform('uRadiusOffset', RADIUS_OFFSET);
		shader.setUniform('uScale', scale);
		shader.setUniform('uTileOffset', tileOffset);

		// bind the ring buffer
		ring.bind();
		// draw ring
		ring.draw();
		// unbind the ring buffer
		ring.unbind();
	}
}

module.exports = SegmentedRing;
