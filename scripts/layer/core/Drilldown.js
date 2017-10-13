'use strict';

const lumo = require('lumo');

const clipBounds = function(cell, bounds) {
	const clipped = new Map();
	bounds.forEach((bound, id) => {
		const clippedBounds = cell.bounds.intersection(bound);
		if (!clippedBounds) {
			return;
		}
		clippedBounds.id = id; // append id
		clipped.set(id, clippedBounds);
	});
	return clipped;
};

const isLeftButton = function(event) {
	return (event.which) ? event.which === 1 : event.button === 0;
};

/**
 * Drilldown TileLayer class.
 */
class Drilldown extends lumo.Overlay {

	/**
	 * Instantiates a drilldown layer.
	 *
	 * @param {Object} options - The options parameter.
	 */
	constructor(options = {}) {
		super(options);
		this.bounds = new Map();
		this.mode = 'read';
	}

	/**
	 * Executed when the layer is added to the plot.
	 *
	 * @param {Plot} plot - The plot object.
	 */
	onAdd(plot) {
		super.onAdd(plot);
	}

	/**
	 * Executed when the layer is removed from the plot.
	 *
	 * @param {Plot} plot - The plot object.
	 */
	onRemove(plot) {
		super.onRemove(plot);
	}

	/**
	 * Enables drawing mode for drilldown.
	 */
	enableDrawing() {
		if (this.plot) {
			this.mode = 'write';
			this.renderer.redraw();
			this.plot.disablePanning();
			this.plot.disableZooming();
			let down = false;
			let currentBox = null;
			let origin = null;
			this.mousedown = event => {
				if (isLeftButton(event.originalEvent)) {
					down = true;
					origin = event.pos;
					currentBox = new lumo.Bounds(origin.x, origin.x, origin.y, origin.y);
					this.renderer.drawTempBounds(currentBox);
				}

			};
			this.mousemove = event => {
				if (down) {
					currentBox = new lumo.Bounds(origin.x, origin.x, origin.y, origin.y);
					currentBox.extend(event.pos);
					this.renderer.drawTempBounds(currentBox);
				}
			};
			this.mouseup = event => {
				if (isLeftButton(event.originalEvent) && down) {
					down = false;
					this.renderer.eraseTempBounds();
					this.addBounds(this.bounds.size, currentBox);
					currentBox = null;
				}
			};
			this.plot.on('mousedown', this.mousedown);
			this.plot.on('mousemove', this.mousemove);
			this.plot.on('mouseup', this.mouseup);
		}
	}

	/**
	 * Disables drawing mode for drilldown.
	 */
	disableDrawing() {
		if (this.plot) {
			this.mode = 'read';
			this.renderer.redraw();
			this.plot.removeListener('mousedown', this.mousedown);
			this.plot.removeListener('mousemove', this.mousemove);
			this.plot.removeListener('mouseup', this.mouseup);
			this.mousedown = null;
			this.mousemove = null;
			this.mouseup = null;
			this.plot.enablePanning();
			this.plot.enableZooming();
		}
	}

	/**
	 * Add a set of bounds to render.
	 *
	 * @param {string} id - The id to store the bounds under.
	 * @param {Array} bounds - The bounds.
	 *
	 * @returns {Drilldown} The overlay object, for chaining.
	 */
	addBounds(id, bounds) {
		this.bounds.set(id, bounds);
		if (this.plot) {
			this.refresh();
			if (this.renderer) {
				this.renderer.redraw();
			}
		}
		return this;
	}

	/**
	 * Resizes an existing bounds object.
	 *
	 * @param {string} id - The id to store the bounds under.
	 * @param {Array} bounds - The new bounds.
	 *
	 * @returns {Drilldown} The overlay object, for chaining.
	 */
	modifyBounds(id, bounds) {
		if (!this.bounds.has(id)) {
			throw `No bounds exists for id \`${id}\``;
		}
		const existing = this.bounds.get(id);
		existing.left = bounds.left;
		existing.right = bounds.right;
		existing.bottom = bounds.bottom;
		existing.top = bounds.top;
		if (this.plot) {
			this.refresh();
			if (this.renderer) {
				this.renderer.redraw();
			}
		}
		return this;
	}

	/**
	 * Remove a set of bounds by id from the overlay.
	 *
	 * @param {string} id - The id to store the bounds under.
	 *
	 * @returns {Drilldown} The overlay object, for chaining.
	 */
	removeBounds(id) {
		this.bounds.delete(id);
		if (this.plot) {
			this.refresh();
			if (this.renderer) {
				this.renderer.redraw();
			}
		}
		return this;
	}

	/**
	 * Remove all bounds from the layer.
	 *
	 * @returns {Drilldown} The overlay object, for chaining.
	 */
	clearBounds() {
		this.clear();
		this.bounds = new Map();
		if (this.plot) {
			this.refresh();
			if (this.renderer) {
				this.renderer.redraw();
			}
		}
		return this;
	}

	/**
	 * Given an array of point based geometry, return the clipped geometry.
	 *
	 * @param {Cell} cell - The rendering cell.
	 *
	 * @returns {Map} The object of clipped geometry.
	 */
	clipGeometry(cell) {
		return clipBounds(cell, this.bounds);
	}
}

module.exports = Drilldown;
