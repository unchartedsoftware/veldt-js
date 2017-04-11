'use strict';

const lumo = require('lumo');

// core renderers
const Core = {
	HTML: lumo.HTMLRenderer,
	SVG: lumo.SVGRenderer,
	WebGL: lumo.WebGLRenderer
};

// html renderers
const HTML = {
	CommunityLabel: require('./html/CommunityLabel'),
	Debug: require('./html/Debug'),
	WordCloud: require('./html/WordCloud')
};

// webgl renderers
const WebGL = {
	Community: require('./webgl/Community'),
	CommunityBucket: require('./webgl/CommunityBucket'),
	Heatmap: require('./webgl/Heatmap'),
	Micro: require('./webgl/Micro'),
	Macro: require('./webgl/Macro'),
	MacroEdge: require('./webgl/MacroEdge'),
	Repeat: require('./webgl/Repeat'),
	BinnedTopHits: require('./webgl/BinnedTopHits')
};

module.exports = {
	Core: Core,
	HTML: HTML,
	WebGL: WebGL
};
