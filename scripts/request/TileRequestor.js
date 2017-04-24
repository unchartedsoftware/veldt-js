'use strict';

const $ = require('jquery');
const _ = require('lodash');
const Requestor = require('./Requestor');

$.ajaxTransport('+arraybuffer', options => {
	let xhr;
	return {
		send: (headers, callback) => {
			// setup all variables
			const url = options.url;
			const type = options.type;
			const async = options.async || true;
			const dataType = 'arraybuffer';
			const data = options.data || null;
			const username = options.username || null;
			const password = options.password || null;
			// create new XMLHttpRequest
			xhr = new XMLHttpRequest();
			xhr.addEventListener('load', () => {
				let d = {};
				d[options.dataType] = xhr.response;
				// make callback and send data
				callback(xhr.status, xhr.statusText, d, xhr.getAllResponseHeaders());
			});
			xhr.open(type, url, async, username, password);
			// setup custom headers
			_.forIn(headers, (header, key) => {
				xhr.setRequestHeader(key, header);
			});
			xhr.responseType = dataType;
			xhr.send(data);
		},
		abort: () => {
			xhr.abort();
		}
	};
});

function isTileStale(layer, coord) {
	const plot = layer.plot;
	if (!plot) {
		// layer no-longer attached to plot, tile is stale
		return true;
	}
	const zoom = Math.round(plot.getTargetZoom());
	const viewport = plot.getTargetViewport();
	// check if tile is at correct zoom and is in view
	return (coord.z !== zoom || !viewport.isInView(coord, plot.wraparound));
}

function liveRequest(requestor, pipeline, index, type, xyz) {
	return function(coord, done) {
		const req = {
			pipeline: pipeline,
			uri: index,
			coord: {
				z: coord.z,
				x: coord.x,
				y: xyz ? Math.pow(2, coord.z) - 1 - coord.y : coord.y
			},
			tile: this.getTile(),
			query: this.getQuery ? this.getQuery() : null
		};
		requestor
			.get(req)
			.done(url => {
				// if stale is tile don't bother pulling it down
				if (isTileStale(this, coord)) {
					done(new Error('stale tile'), null);
					return;
				}
				// otherwise grab it
				$.ajax({
					url: url,
					method: 'POST',
					contentType: 'application/json',
					data: JSON.stringify(req),
					dataType: type
				}).done(buffer => {
					done(null, buffer);
				}).fail((xhr) => {
					let err;
					if (xhr.responseText) {
						const obj = JSON.parse(xhr.responseText);
						err = new Error(obj.error || obj.message);
					} else if (xhr.statusText) {
						err = new Error(xhr.statusText);
					} else {
						err = new Error('Request failed');
					}
					console.error(err);
					done(err, null);
				});
			})
			.fail(err => {
				console.error(err);
				done(err, null);
			});
	};
}

class TileRequestor extends Requestor {

	requestJSON(pipeline, index, xyz = false) {
		return liveRequest(this, pipeline, index, 'json', xyz);
	}

	requestArrayBuffer(pipeline, index, xyz = false) {
		return liveRequest(this, pipeline, index, 'arraybuffer', xyz);
	}
}

module.exports = TileRequestor;
