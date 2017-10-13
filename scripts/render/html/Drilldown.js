'use strict';

const $ = require('jquery');
const lumo = require('lumo');
const EventType = require('../event/EventType');

const CELL_UPDATE = Symbol();
const DRAW_TIMEOUT = Symbol();
const ERASE_TIMEOUT = Symbol();
const DRAW_DEBOUNCE_MS = 400;
const ERASE_DEBOUNCE_MS = 400;
const TRANSLATE_ENABLED = Symbol();
const RESIZE_ENABLED = Symbol();
const RESIZE_ORIGIN = Symbol();
const CURRENT_EDITING = Symbol();
const TEMPORARY_ELEM = Symbol();
const MOUSE_MOVE = Symbol();
const MOUSE_UP = Symbol();

const getStaleBounds = function(overlay, bounds) {
	const clipped = overlay.getClippedGeometry();
	// flag any coord that is not in view as stale
	const stale = new Map();
	bounds.forEach((bound, id) => {
		if (!clipped.has(id)) {
			stale.set(id, bound);
		}
	});
	return stale;
};

const getPixelBounds = function(bounds, cell) {
	const bottomLeft = cell.project({
		x: bounds.left,
		y: bounds.bottom
	});
	const topRight = cell.project({
		x: bounds.right,
		y: bounds.top
	});
	return new lumo.Bounds(bottomLeft.x, topRight.x, bottomLeft.y, topRight.y);
};


const createBoundsElement = function(bounds) {
	const elem = document.createElement('div');
	elem.className += ' drilldown-box';
	elem.style.position = 'absolute';
	elem.style.left = `${bounds.left}px`;
	elem.style.bottom = `${bounds.bottom}px`;
	elem.style.width = `${bounds.getWidth()}px`;
	elem.style.height = `${bounds.getHeight()}px`;
	return elem;
};

const drawAllBounds = function(renderer, container, plot, overlay, bounds) {
	const cell = plot.cell;
	// create document fragment
	const fragment = document.createDocumentFragment();
	// add new tiles to the DOM
	const clipped = overlay.getClippedGeometry(cell);
	clipped.forEach((bound, id) => {
		// check that the bounds hasn't been added in the meantime (occurs on refresh)
		if (!bounds.has(id)) {
			const pixels = getPixelBounds(bound, cell);
			// create the bounds element
			const elem = createBoundsElement(pixels);
			// render to it
			if (renderer.overlay.mode === 'read') {
				renderer.drawBounds(elem, bound);
			} else {
				drawBoundsEditable(renderer, elem, bound, true);
			}
			// add to the fragment
			fragment.append(elem);
			// add the tile
			bounds.set(id, {
				bounds: bound,
				elem: elem
			});
		}
	});
	if (fragment.children.length > 0) {
		// append all new tiles to the container
		container.appendChild(fragment);
		// emit a postdraw event
		renderer.emit(EventType.DOM_POST_DRAW, new lumo.Event(clipped));
	}
};

const eraseBounds = function(renderer, container, bounds, overlay) {
	// remove any stale tiles from DOM
	const stale = getStaleBounds(overlay, bounds);
	stale.forEach((bound, id) => {
		bounds.delete(id);
		container.removeChild(bound.elem);
	});
};

const resetBoundsOffset = function(renderer, cell) {
	renderer.bounds.forEach(bound => {
		const pixels = getPixelBounds(bound, cell);
		bound.elem.style.left = `${pixels.left}px`;
		bound.elem.style.bottom = `${pixels.bottom}px`;
		bound.elem.style.width = `${pixels.getWidth()}px`;
		bound.elem.style.height = `${pixels.getHeight()}px`;
	});
};

const isLeftButton = function(event) {
	return (event.which) ? event.which === 1 : event.button === 0;
};

const addEditHandlers = function(renderer, bounds, topLeft, bottomLeft, topRight, bottomRight, center, remove) {
	$(topLeft).on('mousedown', event => {
		if (isLeftButton(event)) {
			renderer[RESIZE_ENABLED] = true;
			renderer[RESIZE_ORIGIN] = {
				x: bounds.right,
				y: bounds.bottom
			};
			renderer[CURRENT_EDITING] = bounds;
			renderer.overlay.removeBounds(bounds.id);
			renderer.drawTempBounds(bounds);
			event.stopPropagation();
		}
	});
	$(bottomLeft).on('mousedown', event => {
		if (isLeftButton(event)) {
			renderer[RESIZE_ENABLED] = true;
			renderer[RESIZE_ORIGIN] = {
				x: bounds.right,
				y: bounds.top
			};
			renderer[CURRENT_EDITING] = bounds;
			renderer.overlay.removeBounds(bounds.id);
			renderer.drawTempBounds(bounds);
			event.stopPropagation();
		}
	});
	$(topRight).on('mousedown', event => {
		if (isLeftButton(event)) {
			renderer[RESIZE_ENABLED] = true;
			renderer[RESIZE_ORIGIN] = {
				x: bounds.left,
				y: bounds.bottom
			};
			renderer[CURRENT_EDITING] = bounds;
			renderer.overlay.removeBounds(bounds.id);
			renderer.drawTempBounds(bounds);
			event.stopPropagation();
		}
	});
	$(bottomRight).on('mousedown', event => {
		if (isLeftButton(event)) {
			renderer[RESIZE_ENABLED] = true;
			renderer[RESIZE_ORIGIN] = {
				x: bounds.left,
				y: bounds.top
			};
			renderer[CURRENT_EDITING] = bounds;
			renderer.overlay.removeBounds(bounds.id);
			renderer.drawTempBounds(bounds);
			event.stopPropagation();
		}
	});
	$(center).on('mousedown', event => {
		if (isLeftButton(event)) {
			renderer[TRANSLATE_ENABLED] = true;
			renderer[CURRENT_EDITING] = bounds;
			renderer.overlay.removeBounds(bounds.id);
			renderer.drawTempBounds(bounds);
			event.stopPropagation();
		}
	});
	$(remove).on('mousedown', event => {
		if (isLeftButton(event)) {
			renderer.overlay.removeBounds(bounds.id);
			event.stopPropagation();
		}
	});
};

const drawBoundsEditable = function(renderer, elem, bounds, addHandlers = false) {

	const topLeft = document.createElement('div');
	const bottomLeft = document.createElement('div');
	const topRight = document.createElement('div');
	const bottomRight = document.createElement('div');
	const center = document.createElement('div');
	const remove = document.createElement('div');

	topLeft.className = 'drilldown-handle top left';
	bottomLeft.className = 'drilldown-handle bottom left';
	topRight.className = 'drilldown-handle top right';
	bottomRight.className = 'drilldown-handle bottom right';
	center.className = 'drilldown-handle center';
	remove.className = 'drilldown-handle remove';

	if (addHandlers) {
		addEditHandlers(
			renderer,
			bounds,
			topLeft,
			bottomLeft,
			topRight,
			bottomRight,
			center,
			remove);
	}

	elem.appendChild(topLeft);
	elem.appendChild(bottomLeft);
	elem.appendChild(topRight);
	elem.appendChild(bottomRight);
	elem.appendChild(center);
	elem.appendChild(remove);

	elem.className += ' drilldown-editable';
};

/**
 * Class representing a DOM renderer.
 */
class Drilldown extends lumo.OverlayRenderer {

	/**
	 * Instantiates a new Drilldown object.
	 */
	constructor() {
		super();
		this.bounds = new Map();
		this.container = null;
		this[DRAW_TIMEOUT] = null;
		this[ERASE_TIMEOUT] = null;
		this[CELL_UPDATE] = null;
	}

	/**
	 * Executed when the overlay is attached to a plot.
	 *
	 * @param {Layer} overlay - The overlay to attach the renderer to.
	 *
	 * @returns {Drilldown} The renderer object, for chaining.
	 */
	onAdd(overlay) {
		super.onAdd(overlay);
		// create and attach handler
		this[CELL_UPDATE] = event => {
			resetBoundsOffset(this, event.target);
		};
		this.overlay.plot.on(lumo.CELL_UPDATE, this[CELL_UPDATE]);
		// create and attach container
		this.container = this.createContainer();
		this.overlay.plot.container.appendChild(this.container);
		// add editing handlers
		this[MOUSE_MOVE] = event => {
			if (isLeftButton(event) && (this[TRANSLATE_ENABLED] || this[RESIZE_ENABLED])) {
				const pos = this.overlay.plot.mouseToPlotCoord(event);
				if (this[TRANSLATE_ENABLED]) {
					// translating
					const halfWidth = this[CURRENT_EDITING].getWidth() / 2;
					const halfHeight =  this[CURRENT_EDITING].getHeight() / 2;
					this[CURRENT_EDITING].left = pos.x - halfWidth;
					this[CURRENT_EDITING].right = pos.x + halfWidth;
					this[CURRENT_EDITING].bottom = pos.y - halfHeight;
					this[CURRENT_EDITING].top = pos.y + halfHeight;
				} else if (this[RESIZE_ENABLED]) {
					// re-sizing
					this[CURRENT_EDITING].left = this[RESIZE_ORIGIN].x;
					this[CURRENT_EDITING].right = this[RESIZE_ORIGIN].x;
					this[CURRENT_EDITING].bottom = this[RESIZE_ORIGIN].y;
					this[CURRENT_EDITING].top = this[RESIZE_ORIGIN].y;
					this[CURRENT_EDITING].extend(pos);
				}
				this.drawTempBounds(this[CURRENT_EDITING]);
				event.stopPropagation();
			}
		};
		this[MOUSE_UP] = event => {
			if (isLeftButton(event) && (this[TRANSLATE_ENABLED] || this[RESIZE_ENABLED])) {
				this[TRANSLATE_ENABLED] = false;
				this[RESIZE_ENABLED] = false;
				this.eraseTempBounds();
				this.overlay.addBounds(this[CURRENT_EDITING].id, this[CURRENT_EDITING]);
				event.stopPropagation();
			}
		};
		this.overlay.plot.getContainer().addEventListener('mousemove', this[MOUSE_MOVE]);
		this.overlay.plot.getContainer().addEventListener('mouseup', this[MOUSE_UP]);
		return this;
	}

	/**
	 * Executed when the overlay is removed from a plot.
	 *
	 * @param {Layer} overlay - The overlay to remove the renderer from.
	 *
	 * @returns {Drilldown} The renderer object, for chaining.
	 */
	onRemove(overlay) {
		// remove dom handlers
		this.overlay.plot.getContainer().removeEventListener('mousemove', this[MOUSE_MOVE]);
		this.overlay.plot.getContainer().removeEventListener('mouseup', this[MOUSE_UP]);
		this[MOUSE_MOVE] = null;
		this[MOUSE_UP] = null;
		// detach and destroy handlers
		this.overlay.plot.removeListener(lumo.CELL_UPDATE, this[CELL_UPDATE]);
		this[CELL_UPDATE] = null;
		// detach and destroy container
		this.overlay.plot.container.removeChild(this.container);
		this.container = null;
		super.onRemove(overlay);
		return this;
	}

	/**
	 * Create and return the DOM Element which contains the overlay.
	 *
	 * @returns {Element} The overlay container DOM element.
	 */
	createContainer() {
		const container = document.createElement('div');
		container.style.position = 'absolute';
		container.style.left = 0;
		container.style.bottom = 0;
		return container;
	}

	/**
	 * The draw function that is executed per frame.
	 *
	 * @returns {Drilldown} The renderer object, for chaining.
	 */
	draw() {
		const overlay = this.overlay;
		const plot = overlay.plot;
		const bounds = this.bounds;
		const container = this.container;

		const stale = getStaleBounds(overlay, bounds);

		if (bounds.size > 0 && stale.size === bounds.size) {
			// all tiles are stale, remove them all
			if (this[ERASE_TIMEOUT]) {
				clearTimeout(this[ERASE_TIMEOUT]);
				this[ERASE_TIMEOUT] = null;
			}
			bounds.clear();
			container.innerHTML = '';
		} else {
			// not all bounds are stale, remove them individually
			if (!this[ERASE_TIMEOUT]) {
				this[ERASE_TIMEOUT] = setTimeout(()=> {
					// clear timeout
					this[ERASE_TIMEOUT] = null;
					// remove any stale bounds from DOM
					eraseBounds(
						this,
						this.container,
						this.bounds,
						this.overlay);
				}, ERASE_DEBOUNCE_MS);
			}
		}

		if (!this[DRAW_TIMEOUT]) {
			this[DRAW_TIMEOUT] = setTimeout(()=> {
				// clear the timeout
				this[DRAW_TIMEOUT] = null;
				// draw the renderables
				drawAllBounds(
					this,
					this.container,
					this.overlay.plot,
					this.overlay,
					this.bounds);
			}, DRAW_DEBOUNCE_MS);
		}

		// determine container offset
		const delta = plot.cell.project(plot.viewport, plot.zoom);

		// scale on difference between current zoom and tile zoom.
		const tileZoom = Math.round(plot.getTargetZoom());
		const scale = Math.pow(2, tileZoom - plot.zoom);

		// update container
		container.style.transform = `translate3d(${-delta.x}px,${delta.y}px,0) scale(${scale})`;
		container.style.opacity = overlay.getOpacity();
		container.style.zIndex = overlay.getZIndex();

		return this;
	}

	/**
	 * Remove all rendered tiles from the DOM.
	 *
	 * @returns {Drilldown} The renderer object, for chaining.
	 */
	clear() {
		super.clear();
		// remove all tiles and clear the container
		if (this.container) {
			this.container.innerHTML = '';
		}
		if (this.bounds) {
			this.bounds.clear();
		}
		// clear timeouts
		if (this[DRAW_TIMEOUT]) {
			clearTimeout(this[DRAW_TIMEOUT]);
			this[DRAW_TIMEOUT] = null;
		}
		if (this[ERASE_TIMEOUT]) {
			clearTimeout(this[ERASE_TIMEOUT]);
			this[ERASE_TIMEOUT] = null;
		}
		this[TEMPORARY_ELEM] = null;
		return this;
	}

	/**
	 * Forces the renderer to discard all current DOM rendered tiles and
	 * recreate them.
	 *
	 * @returns {Drilldown} The renderer object, for chaining.
	 */
	redraw() {
		this.clear();
		// force draw
		drawAllBounds(
			this,
			this.container,
			this.overlay.plot,
			this.overlay,
			this.bounds);
		return this;
	}

	/**
	 * The draw function that is executed per bounds element.
	 *
	 * @param {HTMLElement} elem - The html dom element object.
	 * @param {Bounds} bounds - The bounds object, in plot coordinates.
	 */
	drawBounds(/*elem, bounds*/) {
	}

	/**
	 * The draw function that is executed when creating or editing a drilldown.
	 *
	 * @param {HTMLElement} elem - The html dom element object.
	 * @param {Bounds} bounds - The bounds object, in plot coordinates.
	 * @param {Bounds} pixels - The bounds object, in cell pixels.
	 */
	drawTempBounds(bounds) {
		const cell = this.overlay.plot.cell;
		const pixels = getPixelBounds(bounds, cell);
		this.eraseTempBounds();
		this[TEMPORARY_ELEM] = createBoundsElement(pixels);
		this[TEMPORARY_ELEM].className += ' drilldown-temporary';
		drawBoundsEditable(this, this[TEMPORARY_ELEM], bounds, false);
		this.container.appendChild(this[TEMPORARY_ELEM]);
	}

	/**
	 * The erase function that is executed when creating or editing a drilldown.
	 */
	eraseTempBounds() {
		if (this[TEMPORARY_ELEM]) {
			this.container.removeChild(this[TEMPORARY_ELEM]);
			this[TEMPORARY_ELEM] = null;
		}
	}
}

module.exports = Drilldown;
