'use strict';

const lumo = require('lumo');

class Image extends lumo.CanvasTextureTileRenderer {

	constructor(options = {}) {
		super(options);
		this.array = null;
	}

	onAdd(layer) {
		super.onAdd(layer);
		this.array = this.createCanvasArray(layer.plot.tileSize);
		return this;
	}

	onRemove(layer) {
		this.destroyCanvasArray(this.array);
		this.array = null;
		super.onRemove(layer);
		return this;
	}

	draw() {
		// draw the pre-rendered images
		this.drawCanvasRenderablesLOD(this.array, false);
		return this;
	}
}

module.exports = Image;
