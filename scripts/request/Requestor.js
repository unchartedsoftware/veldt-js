(function() {

    'use strict';

    const RETRY_INTERVAL = 5000;

    function getHost() {
        const loc = window.location;
        const new_uri = (loc.protocol === 'https:') ? 'wss:' : 'ws:';
        return `${new_uri}//${loc.host}${loc.pathname}`;
    }

    function establishConnection(requestor, callback) {
        requestor.socket = new WebSocket(getHost() + requestor.url);
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
                    requestor.pending.forEach(function(req) {
                        requestor.get(req);
                    });
                    requestor.pending = [];
                });
            }, RETRY_INTERVAL);
        };
    }

    class Requestor {
        constructor(url, callback) {
            this.url = url;
            this.requests = {};
            this.pending = [];
            this.isOpen = false;
            establishConnection(this, callback);
        }
        getHash() {
            // override
        }
        getURL() {
            // override
        }
        get(req) {
            if (!this.isOpen) {
                // if no connection, add request to pending queue
                this.pending.push(req);
                return;
            }
            const hash = this.getHash(req);
            let request = this.requests[hash];
            if (request) {
                return request.promise();
            }
            request = this.requests[hash] = $.Deferred();
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

}());
