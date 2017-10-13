'use strict';

const lumo = require('lumo');

// core renderers
const Core = {
	DOM: require('./dom/DOMRenderer'),
	HTML: require('./dom/HTMLRenderer'),
	SVG: require('./dom/SVGRenderer'),
	Canvas: require('./dom/CanvasRenderer'),
	WebGL: lumo.WebGLRenderer
};

// html renderers
const HTML = {
	CommunityLabel: require('./html/CommunityLabel'),
	Debug: require('./html/Debug'),
	WordCloud: require('./html/WordCloud'),
	Drilldown: require('./html/Drilldown')
};

// canvas renderers
const Canvas = {
	Heatmap: require('./canvas/Heatmap')
};

// webgl renderers
const WebGL = {
	Community: require('./webgl/Community'),
	CommunityBucket: require('./webgl/CommunityBucket'),
	Heatmap: require('./webgl/Heatmap'),
	Image: require('./webgl/Image'),
	Micro: require('./webgl/Micro'),
	Macro: require('./webgl/Macro'),
	MacroEdge: require('./webgl/MacroEdge'),
	Repeat: require('./webgl/Repeat'),
	BinnedTopHits: require('./webgl/BinnedTopHits')
};

module.exports = {
	Core: Core,
	Canvas: Canvas,
	HTML: HTML,
	WebGL: WebGL
};
