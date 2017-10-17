'use strict';

module.exports = {
	/**
	 * Emitted when a DOMRenderer finishes drawing a batch of tiles.
	 */
	DOM_POST_DRAW: 'postdraw',

	/**
	 * Emitted when a Drilldown layer starts editing.
	 */
	DRILLDOWN_EDIT_START: 'drilldowneditstart',

	/**
	 * Emitted when a Drilldown layer is editing.
	 */
	DRILLDOWN_EDIT: 'drilldownedit',

	/**
	 * Emitted when a Drilldown layer stops editing.
	 */
	DRILLDOWN_EDIT_END: 'drilldowneditend',

	/**
	 * Emitted when a Drilldown layer stops editing.
	 */
	DRILLDOWN_REMOVE: 'drilldownremove'
};
