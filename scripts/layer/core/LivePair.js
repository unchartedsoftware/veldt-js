'use strict';

const _ = require('lodash');
const Group = require('./Group');

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

}

module.exports = LivePair;
