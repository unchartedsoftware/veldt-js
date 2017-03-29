'use strict';

const lumo = require('lumo');
const morton = require('../morton/Morton');
const BrightnessTransform = require('../shader/BrightnessTransform');

const INSTANCED_SHADER = {
	common: BrightnessTransform.common,
	vert:
		`
		precision highp float;
		attribute vec2 aPosition;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform vec2 uLODOffset;
		uniform float uLODScale;
		uniform mat4 uProjectionMatrix;
		void main() {
			vec2 wPosition = (aPosition * uScale * uLODScale) + (uTileOffset + (uScale * uLODOffset));
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
		}
		`,
	frag:
		`
		precision highp float;
		uniform vec4 uColor;
		void main() {
			gl_FragColor = brightnessTransform(uColor);
		}
		`
};

const INDIVIDUAL_SHADER = {
	common: BrightnessTransform.common,
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
			if (aPosition.x > 0.0) {
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
			gl_FragColor = brightnessTransform(uColor);
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

const getOffsetIndices = function(x, y, extent, lod) {
	const partitions = Math.pow(2, lod);
	const xcell = x * partitions;
	const ycell = y * partitions;
	const stride = extent * partitions;
	const start = morton(xcell, ycell);
	const stop = start + (stride * stride);
	return [ start, stop ];
};

const draw = function(shader, atlas, renderables) {
	// for each renderable
	renderables.forEach(renderable => {
		// set tile uniforms
		shader.setUniform('uScale', renderable.scale);
		shader.setUniform('uTileOffset', renderable.tileOffset);
		shader.setUniform('uLODScale', 1);
		shader.setUniform('uLODOffset', [0, 0]);
		// draw the points
		atlas.draw(renderable.hash, 'LINES');
	});
};

const drawLOD = function(shader, atlas, plot, lod, renderables) {
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

		const edges = renderable.tile.data.edges;
		const offsets = renderable.tile.data.offsets;

		const startByte = offsets[start];
		const stopByte = (stop === offsets.length) ? edges.byteLength : offsets[stop];

		const offset = startByte / (atlas.stride * 4);
		const count = (stopByte - startByte) / (atlas.stride * 4);
		if (count > 0) {
			// draw the edges
			atlas.draw(renderable.hash, 'LINES', offset, count);
		}
	});
};

class Line {
	constructor(renderer) {
		this.renderer = renderer;
		this.shader = {
			instanced: renderer.createShader(INSTANCED_SHADER),
			individual: renderer.createShader(INDIVIDUAL_SHADER)
		};
		this.line = createLine(renderer.gl);
	}
	drawInstanced(atlas, color) {

		const shader = this.shader.instanced;
		const renderer = this.renderer;
		const layer = renderer.layer;
		const plot = layer.plot;
		const projection = renderer.getOrthoMatrix();

		// bind shader
		shader.use();

		// set global uniforms
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uColor', color);
		shader.setUniform('uBrightness', renderer.brightness);

		// binds the vertex atlas
		atlas.bind();

		if (layer.lod > 0) {
			// draw using LOD
			drawLOD(
				shader,
				atlas,
				plot,
				layer.lod,
				renderer.getRenderablesLOD());
		} else {
			// draw non-LOD
			draw(
				shader,
				atlas,
				renderer.getRenderables());
		}

		// unbind
		atlas.unbind();
	}
	drawIndividual(target, color) {

		const shader = this.shader.individual;
		const line = this.line;
		const renderer = this.renderer;
		const plot = renderer.layer.plot;
		const projection = renderer.getOrthoMatrix();

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
		shader.setUniform('uBrightness', renderer.brightness);

		// binds the buffer to instance
		line.bind();

		// draw the points
		line.draw();

		// unbind
		line.unbind();
	}
}

module.exports = Line;
