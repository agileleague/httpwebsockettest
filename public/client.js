$(function () {
  function report($el, response, startTime, endTime) {
    desc = JSON.parse(response).now
    end = endTime.getTime();
    start = startTime.getTime();
    total = end - start; 
    $el.text("" + desc + ": " + total + "ms (" + start + " -- " + end + ")");
  }
  function url(path) {
    return "" + window.location.host + '/xhr';
  }
  var makeAjaxRequest = function () {
    var startTime = new Date();
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.status === 200 && xhr.readyState === 4) {
        var end = new Date();
        report($('#report-xhr'), xhr.response, startTime, end);
      }
    };
    xhr.open('GET', "http://" + window.location.host + '/xhr');
    xhr.send();
  };
  var connection = new WebSocket('ws://' + window.location.host);
  var wsStartTime;
  var makeWebSocketRequest = function () {
    wsStartTime = new Date();
    connection.send("hello");
  }
  connection.onmessage = function (e) {
    var end = new Date();
    report($('#report-ws'), e.data, wsStartTime, end);
  };
  connection.onerror = function (e) {
    console.log("Websocket error: " + e);
  };
  connection.onclose = function () {
    console.log("closing");
  }
  $('#time-xhr').click(makeAjaxRequest);
  $('#time-ws').click(makeWebSocketRequest);
});
