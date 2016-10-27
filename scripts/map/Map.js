'use strict';

const $ = require('jquery');
const lumo = require('lumo');

class Map extends lumo.Plot {

	constructor(selector, options) {
		super(selector, options);
		this.mousemove = () => {
			$(this.container).css('cursor', '');
		};
		this.on('mousemove', this.mousemove);
	}

	destroy() {
		super.destroy();
		this.removeEventListener('mousemove', this.mousemove);
		this.mousemove = null;
	}

}

module.exports = Map;
