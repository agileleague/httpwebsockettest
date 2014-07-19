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

var app = express();
app.use(express.static("./public"));
app.use(function (req, res) {
  if (req.url === "/xhr") {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(buildResponse());
  } else {
    res.writeHead(404);
    res.end("");
  }
});
var server = http.createServer(app).listen(port);

var wss = new WebSocketServer({server: server});
wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    ws.send(buildResponse({id: message}));
  });
});
