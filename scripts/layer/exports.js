'use strict';

module.exports = {
	// debug
	Debug: require('./core/Debug'),
	// live
	Live: require('./core/Live'),
	// group
	Group: require('./core/Group'),
	// types
	Count: require('./type/Count'),
	Community: require('./type/Community'),
	Exclusiveness: require('./type/Exclusiveness'),
	// Frequency: require('./type/Frequency'),
	Heatmap: require('./type/Heatmap'),
	Macro: require('./type/Macro'),
	Micro: require('./type/Micro'),
	MacroEdge: require('./type/MacroEdge'),
	Rest: require('./type/Rest'),
	Topic: require('./type/Topic'),
	TopTermCount: require('./type/TopTermCount'),
	// Preview: require('./type/Preview'),
	// TopFrequency: require('./type/TopFrequency'),
	// TopHits: require('./type/TopHits'),
	// TopicCount: require('./type/TopicCount'),
	// TopicFrequency: require('./type/TopicFrequency')
};
