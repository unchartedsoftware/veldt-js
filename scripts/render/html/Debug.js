'use strict';

const $ = require('jquery');
const lumo = require('lumo');

class Debug extends lumo.HTMLRenderer {

	constructor(options = {}) {
		super(options);
	}

	drawTile(element, coord) {
		$(element)
			.empty()
			.append(`<div style="top:0; left:0;">${coord.z}, ${coord.x}, ${coord.y}</div>`);
	}
}

module.exports = Debug;
