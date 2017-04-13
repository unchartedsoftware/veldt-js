'use strict';

const _ = require('lodash');
const Group = require('./Group');

/**
 * LivePair layer acts as an extension of the Group layer in which there are
 * two layers, a parent and a child. Any temporary filters applied will be
 * applied only to the child layer.
 */
class LivePair extends Group {

	constructor(parent, child, options = {}) {
		super(options);

		if (_.isNil(parent) || _.isNil(parent.addFilter)) {
			throw 'LivePair \'parent\' argument must be a Live layer';
		}
		if (_.isNil(child) || _.isNil(child.addFilter)) {
			throw 'LivePair \'child\' argument must be a Live layer';
		}

		this.hideParentWhenFiltered = _.get(options, 'hideParentWhenFiltered', false);

		this.parent = parent;
		this.child = child;
		this.layers.push(parent);
		this.layers.push(child);
		// Filters that only get applied to the child.
		this.temporaryFilters = new Map();
	}

	enable() {
		this.hidden = false;
		this.muted = false;

		if (this.temporaryFilters.size === 0 || !this.hideParentWhenFiltered) {
			this.parent.show();
			this.parent.unmute();
		}

		if (this.temporaryFilters.size > 0) {
			this.child.show();
			this.child.unmute();
		}

		return this;
	}

	addFilter(id, filter, isTemporary = false) {
		if (!isTemporary) {
			super.addFilter(id, filter);
			return;
		}

		if (this.hideParentWhenFiltered) {
			this.parent.disable();
		}

		this.temporaryFilters.set(id, filter);
		this.child.addFilter(id, filter);
		if (!this.isHidden()) {
			this.child.enable();
		}
	}

	removeFilter(id, isTemporary = false) {
		if (!isTemporary) {
			super.removeFilter(id);
			return;
		}

		this.temporaryFilters.delete(id);
		this.child.removeFilter(id);

		// No filters applied? Then restore the parent and hide the child.
		if (this.temporaryFilters.size === 0) {
			this.child.disable();
			if (this.hideParentWhenFiltered) {
				if (!this.isHidden()) {
					this.parent.enable();
				}
			}
		}
	}

	isHidden() {
		return this.parent.isHidden();
	}

	isMuted() {
		return this.parent.isMuted();
	}

	isDisabled() {
		return this.parent.isDisabled();
	}

	getZIndex() {
		return this.parent.getZIndex();
	}

	getOpacity() {
		return this.parent.getOpacity();
	}

	isFiltered() {
		return this.parent.isFiltered() || this.child.isFiltered();
	}

}

module.exports = LivePair;
