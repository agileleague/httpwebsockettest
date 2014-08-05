"use strict";

var http = require('http');
var fs = require('fs');
var express = require('express');
var WebSocketServer = require('ws').Server;

var port = process.env.PORT || 3000;

var buildResponse = function (properties) {
  properties = properties || {};
  properties.now = new Date();
  return JSON.stringify(properties);
}

var bufferResponse = function (responder, delay) {
  if (delay) {
    setTimeout(responder, 1000);
  } else {
    responder();
  }
};

var app = express();
app.use(express.static("./public"));
app.use(app.router);
app.get('/xhr', function (req, res) {
  bufferResponse(function () {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(buildResponse());
  }, req.query.delay == '1');
});
var server = http.createServer(app).listen(port);

var wss = new WebSocketServer({server: server});
wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    message = JSON.parse(message);
    bufferResponse(function () {
      ws.send(buildResponse({id: message.id}));
    }, message.delay == '1');
  });
});
