'use strict';

const $ = require('jquery');
const HTMLRenderer = require('../dom/HTMLRenderer');

class Debug extends HTMLRenderer {

	constructor(options = {}) {
		super(options);
	}

	drawTile(element, tile) {
		$(element)
			.empty()
			.css({
				'border-left': '1px solid rgba(255, 255, 255, 0.5)',
				'border-top': '1px solid rgba(255, 255, 255, 0.5)'
			})
			.append(`<div style="position: absolute; top:10px; left:10px;">(${tile.coord.z}, ${tile.coord.x}, ${tile.coord.y})</div>`);
	}
}

module.exports = Debug;
