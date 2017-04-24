'use strict';

const lumo = require('lumo');
const morton = require('../morton/Morton');
const BrightnessTransform = require('../shader/BrightnessTransform');
const ColorRampGLSL = require('../shader/ColorRamp');

const INSTANCED_SHADER = {
	common: [ BrightnessTransform.common, ColorRampGLSL.common ].join('\n'),
	vert:
		`
		attribute vec2 aPosition;
		attribute float aWeight;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform vec2 uLODOffset;
		uniform float uLODScale;
		uniform mat4 uProjectionMatrix;
		uniform vec4 uViewport;
		uniform float uOpacity;
		varying vec4 vColor;
		void main() {
			vec2 wPosition = (aPosition * uScale * uLODScale) + (uTileOffset + (uScale * uLODOffset));
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);

			vec4 color;
			float x = wPosition[0];
			float y = wPosition[1];
			if (x >= uViewport[0] && x <= uViewport[2] && y >= uViewport[1] && y <= uViewport[3]) {
				color = brightnessTransform(colorRampLookup(aWeight));
				color.a = color.a * uOpacity;
			} else {
				color = vec4(0.0, 0.0, 0.0, 0.0);
			}

			vColor = color;
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

const INDIVIDUAL_SHADER = {
	common: [ BrightnessTransform.common, ColorRampGLSL.common ].join('\n'),
	vert:
		`
		attribute vec2 aPosition;
		uniform vec2 uTileOffset;
		uniform float uScale;
		uniform mat4 uProjectionMatrix;
		uniform vec2 uPointA;
		uniform vec2 uPointB;
		uniform vec2 uWeights;
		uniform float uOpacity;
		varying vec4 vColor;
		void main() {
			vec2 wPosition;
			float wWeight;
			if (aPosition.x > 0.0) {
				wPosition = (uPointA * uScale) + uTileOffset;
				wWeight = uWeights.x;
			} else {
				wPosition = (uPointB * uScale) + uTileOffset;
				wWeight = uWeights.y;
			}
			gl_Position = uProjectionMatrix * vec4(wPosition, 0.0, 1.0);
			vec4 color = brightnessTransform(colorRampLookup(wWeight));
			vColor = vec4(color.rgb, color.a * uOpacity);
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
			// not enough lod to support it
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

class Edge {

	constructor(renderer, transform, colorRamp) {
		this.renderer = renderer;
		this.setTransform(transform);
		this.setColorRamp(colorRamp);
		this.line = createLine(renderer.gl);
	}

	setTransform(transform) {
		// re-compile shaders
		this.shader = {
			instanced: this.renderer.createShader(
				ColorRampGLSL.addTransformDefine(INSTANCED_SHADER, transform)),
			individual: this.renderer.createShader(
				ColorRampGLSL.addTransformDefine(INDIVIDUAL_SHADER, transform))
		};
	}

	setColorRamp(colorRamp) {
		this.ramp = ColorRampGLSL.createRampTexture(this.renderer.gl, colorRamp);
	}

	drawInstanced(atlas) {

		const shader = this.shader.instanced;
		const renderer = this.renderer;
		const layer = renderer.layer;
		const plot = layer.plot;
		const ramp = this.ramp;
		const extrema = layer.getExtrema();
		const projection = renderer.getOrthoMatrix();
		const viewportSize = plot.getTargetViewportPixelSize();


		// bind shader
		shader.use();

		// bind color ramp
		ramp.bind(0);

		// set global uniforms
		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uBrightness', renderer.brightness);
		shader.setUniform('uColorRampSampler', 0);
		shader.setUniform('uColorRampSize', ramp.width);
		shader.setUniform('uOpacity', layer.opacity);
		shader.setUniform('uRangeMin', renderer.range[0]);
		shader.setUniform('uRangeMax', renderer.range[1]);
		shader.setUniform('uMin', extrema.min);
		shader.setUniform('uMax', extrema.max);
		shader.setUniform('uViewport', [
			0,
			0,
			viewportSize.width,
			viewportSize.height
		]);

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

	drawIndividual(target) {

		const shader = this.shader.individual;
		const line = this.line;
		const renderer = this.renderer;
		const layer = renderer.layer;
		const plot = layer.plot;
		const ramp = this.ramp;
		const extrema = layer.getExtrema();
		const projection = renderer.getOrthoMatrix();
		const viewportOffset = plot.getViewportPixelOffset();

		// get tile offset
		const coord = target.tile.coord;
		const scale = Math.pow(2, plot.zoom - coord.z);
		const tileOffset = [
			(coord.x * scale * plot.tileSize) - viewportOffset.x,
			(coord.y * scale * plot.tileSize) - viewportOffset.y
		];

		// bind shader
		shader.use();

		// bind color ramp
		ramp.bind(0);

		shader.setUniform('uProjectionMatrix', projection);
		shader.setUniform('uTileOffset', tileOffset);
		shader.setUniform('uPointA', [ target.a.x, target.a.y ]);
		shader.setUniform('uPointB', [ target.b.x, target.b.y ]);
		shader.setUniform('uWeights', [ target.a.weight, target.b.weight ]);
		shader.setUniform('uScale', scale);
		shader.setUniform('uBrightness', renderer.brightness);
		shader.setUniform('uColorRampSampler', 0);
		shader.setUniform('uColorRampSize', ramp.width);
		shader.setUniform('uOpacity', layer.opacity);
		shader.setUniform('uRangeMin', renderer.range[0]);
		shader.setUniform('uRangeMax', renderer.range[1]);
		shader.setUniform('uMin', extrema.min);
		shader.setUniform('uMax', extrema.max);

		// binds the buffer to instance
		line.bind();

		// draw the points
		line.draw();

		// unbind
		line.unbind();
	}
}

module.exports = Edge;
