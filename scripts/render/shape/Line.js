'use strict';

const lumo = require('lumo');

const INSTANCED_SHADER = {
	vert:
		`
		precision highp float;
		attribute vec2 aPosition;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uScale) + uTileOffset;
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		`
		precision highp float;
		uniform vec4 uColor;
		void main() {
			gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
		}
		`
};

const INDIVIDUAL_SHADER = {
	vert:
		`
		precision highp float;
		attribute vec2 aPosition;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform mat4 uProjectionMatrix;
		uniform vec2 uPointA;
		uniform vec2 uPointB;
		void main() {
			vec2 wPosition;
			if (aPosition.x > 0) {
				wPosition = (uPointA * uScale) + uTileOffset;
			} else {
				wPosition = (uPointB * uScale) + uTileOffset;
			}
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		`
		precision highp float;
		uniform vec4 uColor;
		void main() {
			gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
		}
		`
};

const createLine = function(gl) {
	const vertices = new Float32Array(2);
	vertices[0] = 1.0;
	vertices[1] = 1.0;
	vertices[2] = -1.0;
	vertices[3] = -1.0;
	// create quad buffer
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
			mode: 'LINES',
			count: 1
		});
};

class Line {
	constructor(renderer) {
		this.renderer = renderer;
		this.line = createLine(renderer.gl);
		this.shaders = {
			instanced: renderer.createShader(INSTANCED_SHADER),
			individual: renderer.createShader(INDIVIDUAL_SHADER)
		};
	}
	drawInstanced(atlas, color) {

		const shader = this.shader.instanced;
		const renderer = this.renderer;
		const projection = renderer.getOrthoMatrix();
		const renderables = renderer.getRenderables();

		// bind shader
		shader.use();

		// set global uniforms
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uColor', color);

		// binds the vertex atlas
		atlas.bind();

		// for each renderable
		renderables.forEach(renderable => {
			// set tile uniforms
			shader.setUniform('uScale', renderable.scale);
			shader.setUniform('uTileOffset', renderable.tileOffset);
			// draw the points
			atlas.draw(renderable.hash, 'LINES');
		});

		// unbind
		atlas.unbind();
	}
	drawIndividual(target, color) {

		const shader = this.shader.individual;
		const point = this.point;
		const plot = this.renderer.layer.plot;
		const projection = this.renderer.getOrthoMatrix();

		// get tile offset
		const coord = target.tile.coord;
		const scale = Math.pow(2, plot.zoom - coord.z);
		const tileOffset = [
			(coord.x * scale * plot.tileSize) - plot.viewport.x,
			(coord.y * scale * plot.tileSize) - plot.viewport.y
		];

		// bind shader
		shader.use();

		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uTileOffset', tileOffset);
		shader.setUniform('uPointA', [ target.a.x, target.a.y ]);
		shader.setUniform('uPointB', [ target.b.x, target.b.y ]);
		shader.setUniform('uScale', scale);
		shader.setUniform('uColor', color);

		// binds the buffer to instance
		point.bind();

		// draw the points
		point.draw();

		// unbind
		point.unbind();
	}
}

module.exports = Line;
