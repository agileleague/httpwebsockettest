$(function () {
  var WebSocketTest = function (count, reporter) {
    this.count = count;
    this._reporter = reporter;
    this.sentRequests = {};
    this.receivedRequests = {};
    this.startTime = null;
    this.endtime = null;
    this._replies = 0;
    this._run = false;
  }
  WebSocketTest.prototype.perform = function () {
    if (this._run) {
      throw new Error("This test has already been run");
    }
    this._setupConnection();
    var that = this;
    this._connection.onopen = function () {
      that.startTime = new Date();
      for (var i = 0; i < that.count; i++) {
        that._fireRequest(i);
      }
    };
  }
  WebSocketTest.prototype._setupConnection = function () {
    this._run = true;
    this._connection = new WebSocket('ws://' + window.location.host);
    var that = this;
    this._connection.onmessage = function (e) {
      var end = new Date();
      var id = JSON.parse(e.data)['id'];
      that.receivedRequests[id] = end;
      that._replies++;
      if (that._replies == that.count) {
        that._close();
      }
    };
    this._connection.onerror = function (e) {
      console.log("Websocket error: " + e);
    };
    this._connection.onclose = function () {
      console.log("closing");
    }
  }
  WebSocketTest.prototype._closeConnection = function () {
    this._connection.close();
  }
  WebSocketTest.prototype._fireRequest = function (id) {
    var start = new Date();
    this._connection.send(id);
    this.sentRequests[id] = start;
  }
  WebSocketTest.prototype._close = function () {
    this.endTime = new Date();
    this._closeConnection();
    this._reporter.report(this);
  }

  var Reporter = function Reporter(el) {
    this._el = el;
  }
  Reporter.prototype.report = function(test) {
    var startTime = test.startTime, 
      endTime = test.endTime,
      reports = [];

    reports.push(this._formatReport("Total time", startTime, endTime));
    for(var i = 0; i < test.count; i++) {
      reports.push(this._formatReport(test.sentRequests[i], test.sentRequests[i], test.receivedRequests[i]));
    }
    this._el.html(reports.join("<br>"));
  }
  Reporter.prototype._formatReport = function (desc, startTime, endTime) {
    var end = endTime.getTime();
    var start = startTime.getTime();
    var total = end - start; 

    return "" + desc + ": " + total + "ms (" + start + " -- " + end + ")";
  }


  var HttpTest = function HttpRequest(count, reporter) {
    this.count = count;
    this._reporter = reporter;
    this.sentRequests = {};
    this.receivedRequests = {};
    this._replies = 0;
    this._run = false;
  };
  HttpTest.prototype.perform = function () {
    if (this._run) {
      throw new Error("This test has already been run");
    }
    this._run = true;
    this.startTime = new Date();
    for (var i = 0; i < this.count; i++) {
      this._fireRequest(i);
    }
  }
  HttpTest.prototype._fireRequest = function (id) {
    this.sentRequests[id] = new Date();
    var xhr = new XMLHttpRequest();
    var that = this;
    xhr.onreadystatechange = function () {
      if (xhr.status === 200 && xhr.readyState === 4) {
        that._handleResponse(id);
      }
    };
    xhr.open('GET', "http://" + window.location.host + '/xhr');
    xhr.send();
  }
  HttpTest.prototype._handleResponse = function (id) {
    this.receivedRequests[id] = new Date();
    this._replies++;
    if (this._replies == this.count) {
      this._close();
    }
  }
  HttpTest.prototype._close = function () {
    this.endTime = new Date();
    this._reporter.report(this);
  }

  $('#test-panel').submit(function (e) {
    var driver = $('#test-type').val() == "Web Socket" ? WebSocketTest : HttpTest;
    var count = parseInt($('#count').val());
    if (!count) {
      return alert('You must specify the number of concurrent requests in count.');
    }
    new driver(count, new Reporter($('#results'))).perform();
    e.preventDefault();
  });
});
