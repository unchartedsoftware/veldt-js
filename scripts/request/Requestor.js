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
		callback(null, requestor);
	};
	// on message
	requestor.socket.onmessage = function(event) {
		const res = JSON.parse(event.data);
		// save success and error here, as we need to remove them to hash
		// correctly
		const success = res.success;
		const error = res.error;
		const hash = requestor.getHash(res);
		const request = requestor.requests.get(hash);
		requestor.requests.delete(hash);
		if (success) {
			request.resolve(requestor.getURL());
		} else {
			request.reject(new Error(error));
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
		// reject all current requests
		requestor.requests.forEach(function(key, request) {
			request.reject();
		});
		// clear request map
		requestor.requests = new Map();
		// attempt to re-establish connection
		setTimeout(function() {
			establishConnection(requestor, function() {
				// once connection is re-established, send pending requests
				requestor.pending.forEach(function(key, pending) {
					const request = pending.request;
					const deferred = pending.deferred;
					const hash = pending.hash;
					requestor.requests.set(hash, deferred);
					requestor.socket.send(JSON.stringify(request));
				});
				// clear pending map
				requestor.pending = new Map();
			});
		}, RETRY_INTERVAL);
	};
}

function prune(current) {
	_.forOwn(current, (value, key) => {
		if (_.isUndefined(value) ||
			_.isNull(value) ||
			_.isNaN(value) ||
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
	return prune(_.cloneDeep(obj));
}

function hashReq(req) {
	req.error = undefined;
	req.success = undefined;
	return stringify(pruneEmpty(req));
}

class Requestor {
	constructor(url, callback) {
		this.url = url;
		this.requests = new Map();
		this.pending = new Map();
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
			let pending = this.pending.get(hash);
			if (pending) {
				return pending.deferred.promise();
			}
			// if no connection, add request to pending queue
			const deferred = new $.Deferred();
			pending = {
				hash: hash,
				request: req,
				deferred: deferred
			};
			this.pending.set(hash, pending);
			return deferred.promise();
		}
		let deferred = this.requests.get(hash);
		if (deferred) {
			return deferred.promise();
		}
		deferred = new $.Deferred();
		this.requests.set(hash, deferred);
		this.socket.send(JSON.stringify(req));
		return deferred.promise();
	}
	close() {
		this.socket.onclose = null;
		this.socket.close();
		this.socket = null;
	}
}

module.exports = Requestor;
