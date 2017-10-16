'use strict';

module.exports = {
	/**
	 * Emitted when a DOMRenderer finishes drawing a batch of tiles.
	 */
	DOM_POST_DRAW: 'postdraw',

	/**
	 * Emitted when a Drilldown layer starts editting.
	 */
	DRILLDOWN_EDIT_START: 'drilldowneditstart',

	/**
	 * Emitted when a Drilldown layer is editting.
	 */
	DRILLDOWN_EDIT: 'drilldownedit',

	/**
	 * Emitted when a Drilldown layer stops editting.
	 */
	DRILLDOWN_EDIT_END: 'drilldowneditend'
};
