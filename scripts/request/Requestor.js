(function() {

    'use strict';

    var $ = require('jquery');

    function getHost() {
        var loc = window.location;
        var new_uri;
        if (loc.protocol === 'https:') {
            new_uri = 'wss:';
        } else {
            new_uri = 'ws:';
        }
        return new_uri + '//' + loc.host + loc.pathname;
    }

    function Requestor(url, callback) {
        var self = this;
        this.requests = {};
        this.socket = new WebSocket(getHost() + url);
        this.socket.onopen = callback;
        this.socket.onmessage = function(event) {
            var res = JSON.parse(event.data);
            var hash = self.getHash(res);
            var request = self.requests[hash];
            delete self.requests[hash];
            if (res.success) {
                request.resolve(self.getURL(res), res);
            } else {
                request.reject(res);
            }
        };
        this.socket.onclose = function() {
            console.warn('Websocket connection closed.');
        };
    }

    Requestor.prototype.getHash = function( /*req*/ ) {
        // override
    };

    Requestor.prototype.getURL = function( /*res*/ ) {
        // override
    };

    Requestor.prototype.get = function(req) {
        var hash = this.getHash(req);
        var request = this.requests[hash];
        if (request) {
            return request.promise();
        }
        request = this.requests[hash] = $.Deferred();
        this.socket.send(JSON.stringify(req));
        return request.promise();
    };

    module.exports = Requestor;

}());
