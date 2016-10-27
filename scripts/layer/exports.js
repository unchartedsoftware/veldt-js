'use strict';

module.exports = {
	// debug
	Debug: require('./core/Debug'),
	// live
	Live: require('./core/Live'),
	// types
	Count: require('./type/Count'),
	Custom: require('./type/Custom'),
	Frequency: require('./type/Frequency'),
	Heatmap: require('./type/Heatmap'),
	Macro: require('./type/Macro'),
	Micro: require('./type/Micro'),
	Preview: require('./type/Preview'),
	TopCount: require('./type/TopCount'),
	TopFrequency: require('./type/TopFrequency'),
	TopHits: require('./type/TopHits'),
	TopTrails: require('./type/TopTrails'),
	TopicCount: require('./type/TopicCount'),
	TopicFrequency: require('./type/TopicFrequency')
};
