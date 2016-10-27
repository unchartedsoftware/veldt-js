'use strict';

const _ = require('lodash');
const stringify = require('json-stable-stringify');
const Requestor = require('./Requestor');

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

class TileRequestor extends Requestor {
	constructor(url, callback) {
		super(url, callback);
	}
	getHash(req) {
		const coord = req.coord;
		const hash = stringify(pruneEmpty(req.params));
		return `${req.type}-${req.uri}-${req.store}-${coord.z}-${coord.x}-${coord.y}-${hash}`;
	}
	getURL(res) {
		const coord = res.coord;
		return `tile/${res.type}/${res.uri}/${res.store}/${coord.z}/${coord.x}/${coord.y}`;
	}
}

module.exports = TileRequestor;
