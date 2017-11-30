'use strict';

module.exports = {
	// debug
	Debug: require('./core/Debug'),
	// drilldown
	Drilldown: require('./core/Drilldown'),
	// base
	Base: require('./core/Base'),
	// live
	Live: require('./core/Live'),
	// group
	Group: require('./core/Group'),
	// swap
	Swap: require('./core/Swap'),
	// live-result pair
	LivePair: require('./core/LivePair'),
	// types
	Count: require('./type/Count'),
	Community: require('./type/Community'),
	Heatmap: require('./type/Heatmap'),
	Macro: require('./type/Macro'),
	Micro: require('./type/Micro'),
	MacroEdge: require('./type/MacroEdge'),
	Rest: require('./type/Rest'),
	TopTermCount: require('./type/TopTermCount'),
	TermsFrequencyCount: require('./type/TermsFrequencyCount'),
	BinnedTopHits: require('./type/BinnedTopHits')
};
