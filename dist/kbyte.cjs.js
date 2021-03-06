'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// import objectHash from 'byteballcore/object_hash';

let WebSocket;
if (typeof window !== 'undefined') {
  WebSocket = window.WebSocket;
} else {
  WebSocket = require('ws');
}

const wait = (ws, cb) => {
  setTimeout(() => {
    if (ws.readyState === 1) {
      if (cb !== null) cb();
    } else {
      wait(ws, cb);
    }
  }, 5);
};

class Client {
  constructor(address) {
    this.address = address;
    this.open = false;
    this.queue = {};
    this.notifications = () => {};

    this.ws = new WebSocket(address);

    this.ws.addEventListener('message', (data) => {
      const message = JSON.parse(data.data);
      if (this.queue[message[1].tag]) {
        const error = message[1].response.error || null;
        const result = error ? null : message[1].response;
        this.queue[message[1].tag](error, result);
      } else {
        this.notifications(null, message);
      }
    });

    this.ws.addEventListener('open', () => {
      this.open = true;
    });

    this.ws.addEventListener('close', () => {
      this.open = false;
    });
  }

  subscribe(cb) {
    this.notifications = cb;
  }

  send(message) {
    wait(this.ws, () => {
      this.ws.send(JSON.stringify(message));
    });
  }

  request(command, params, cb) {
    const request = { command };
    if (params) request.params = params;
    // request.tag = objectHash.getBase64Hash(request);
    request.tag = Math.random().toString(36).substring(7);
    this.queue[request.tag] = cb;
    this.send(['request', request]);
  }

  justsaying(subject, body) {
    const justsaying = { subject };
    if (body) justsaying.body = body;
    this.send(['justsaying', justsaying]);
  }
}

exports.Client = Client;
