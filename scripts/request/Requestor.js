'use strict';

const _ = require('lodash');
const $ = require('jquery');
const stringify = require('json-stable-stringify');

const RETRY_INTERVAL = 5000;

function getHost() {
	const loc = window.location;
	const new_uri = (loc.protocol === 'https:') ? 'wss:' : 'ws:';
	return `${new_uri}//${loc.host}${loc.pathname}`;
}

function establishConnection(requestor, callback) {
	requestor.socket = new WebSocket(`${getHost()}ws/${requestor.url}`);
	// on open
	requestor.socket.onopen = function() {
		requestor.isOpen = true;
		console.log('Websocket connection established');
		callback.apply(this, arguments);
	};
	// on message
	requestor.socket.onmessage = function(event) {
		const res = JSON.parse(event.data);
		const hash = requestor.getHash(res);
		const request = requestor.requests[hash];
		delete requestor.requests[hash];
		if (res.success) {
			request.resolve(requestor.getURL(res), res);
		} else {
			request.reject(res);
		}
	};
	// on close
	requestor.socket.onclose = function() {
		// log close only if connection was ever open
		if (requestor.isOpen) {
			console.warn('Websocket connection closed, attempting to re-connect in', RETRY_INTERVAL);
		}
		requestor.socket = null;
		requestor.isOpen = false;
		// reject all pending requests
		Object.keys(requestor.requests).forEach(function(key) {
			requestor.requests[key].reject();
		});
		// clear request map
		requestor.requests = {};
		// attempt to re-establish connection
		setTimeout(function() {
			establishConnection(requestor, function() {
				// once connection is re-established, send pending requests
				Object.keys(requestor.pending).forEach(function(key, val) {
					const req = val.req;
					const p = val.p;
					const hash = this.getHash(req);
					requestor.requests[hash] = p;
					requestor.socket.send(JSON.stringify(req));
				});
				requestor.pending = {};
			});
		}, RETRY_INTERVAL);
	};
}

function prune(current) {
	_.forOwn(current, (value, key) => {
	  if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value) ||
		(_.isString(value) && _.isEmpty(value)) ||
		(_.isObject(value) && _.isEmpty(prune(value)))) {
		delete current[key];
	  }
	});
	// remove any leftover undefined values from the delete
	// operation on an array
	if (_.isArray(current)) {
		_.pull(current, undefined);
	}
	return current;
}

function pruneEmpty(obj) {
	// do not modify the original object, create a clone instead
	prune(_.cloneDeep(obj));
}

function hashReq(req) {
	return stringify(pruneEmpty(req));
}

class Requestor {
	constructor(url, callback) {
		this.url = url;
		this.requests = {};
		this.pending = {};
		this.isOpen = false;
		establishConnection(this, callback);
	}
	getHash(req) {
		return hashReq(req);
	}
	getURL() {
		return this.url;
	}
	get(req) {
		const hash = this.getHash(req);
		if (!this.isOpen) {
			let pending = this.pending[hash];
			if (pending) {
				return pending.p.promise();
			}
			// if no connection, add request to pending queue
			const p = new $.Deferred();
			pending = {
				req: req,
				p: p
			};
			this.pending[hash] = pending;
			return p;
		}
		let request = this.requests[hash];
		if (request) {
			return request.promise();
		}
		request = this.requests[hash] = new $.Deferred();
		this.socket.send(JSON.stringify(req));
		return request.promise();
	}
	close() {
		this.socket.onclose = null;
		this.socket.close();
		this.socket = null;
	}
}

module.exports = Requestor;
