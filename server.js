"use strict";

var http = require('http');
var express = require('express');
var WebSocketServer = require('ws').Server;

var app = express();
app.use(express.static("./public"));
app.use(app.router);
app.get('/xhr', function (req, res) {
  bufferResponse(function () {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(buildResponse());
  }, req.query.delay == '1');
});
var port = process.env.PORT || 3000;
var server = http.createServer(app).listen(port);

var wss = new WebSocketServer({server: server, path: "/ws"});
wss.on('connection', function(socket) {
  socket.on('message', function(message) {
    message = JSON.parse(message);
    bufferResponse(function () {
      socket.send(buildResponse({id: message.id}));
    }, message.delay == '1');
  });
});

console.log("listening on " + port);

var buildResponse = function (properties) {
  properties = properties || {};
  properties.now = new Date();
  return JSON.stringify(properties);
};

var bufferResponse = function (responder, delay) {
  delay ? setTimeout(responder, 100) : responder();
};