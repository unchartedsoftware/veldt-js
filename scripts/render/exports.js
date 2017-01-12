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
	//Debug: require('./html/Debug'),
	//TopTerms: require('./html/TopTerms'),
	WordCloud: require('./html/WordCloud')
};

// webgl renderers
const WebGL = {
	Community: require('./webgl/Community'),
	CommunityBucket: require('./webgl/CommunityBucket'),
	Heatmap: require('./webgl/Heatmap'),
	Micro: require('./webgl/Micro'),
	Macro: require('./webgl/Macro'),
	Repeat: require('./webgl/Repeat')
};

module.exports = {
	Core: Core,
	HTML: HTML,
	WebGL: WebGL
};
