'use strict';

class MixinBuilder {
	constructor(superclass) {
		this.superclass = superclass;
	}
	with(...mixins) {
		return mixins.reduce((c, mixin) => mixin(c), this.superclass);
	}
}

module.exports = function(superclass) {
	return new MixinBuilder(superclass);
};
