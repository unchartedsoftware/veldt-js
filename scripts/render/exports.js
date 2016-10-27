'use strict';

const lumo = require('lumo');

const Core = {
	HTML: lumo.HTMLRenderer,
	SVG: lumo.SVGRenderer,
	WebGL: lumo.HTMLRenderer
};


// html renderers
const HTML = {
	Community: require('./html/Community'),
	CommunityLabel: require('./html/CommunityLabel'),
	Debug: require('./html/Debug'),
	WordCloud: require('./html/WordCloud')
};

// webgl renderers
const WebGL = {
	Heatmap: require('./webgl/Heatmap'),
	Micro: require('./webgl/Micro'),
	Macro: require('./webgl/Macro')
	//Community: require('./webgl/Community')
};

module.exports = {
	Core: Core,
	HTML: HTML,
	WebGL: WebGL
};
