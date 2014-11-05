var url = require('url'),
    request = require('request'),
    es = require('event-stream'),
    Promise = require('bluebird'),
    _ = require('underscore');

module.exports = function(endpoint, timeout, pollDelay) {

  if (!endpoint) {
    throw new Error('Must supply endpoint');
  }

  var requestTimeout = timeout || 5 * 60 * 1000;
  var pollingDelay = pollDelay || 5 * 1000;

  function requestReport(name, path, params, cb) {

    var body = {
      reportUnitUri: path + "/" + name,
      async: "true",
      outputFormat: "pdf"
    };

    if (params) {
      body.parameters = {
        parameterValues: {}
      };
      _.each(params, function(value, key) {
        body.parameters.parameterValues[key] = value;
      });
    }

    var options = {
      url: endpoint + "/rest_v2/reportExecutions",
      method: "POST",
      body: body,
      json: true,
      headers: {
        "Accept": "application/json"
      }
    };

    request(options, function(err, response, body) {
      if (err) {
        return cb(err);
      }

      if (response.statusCode === 200) {
        function isSessionCookie(cookie) {
          return /^JSESSIONID/.test(cookie);
        }
        var cookieHeaders = _.isArray(response.headers["set-cookie"]) ? response.headers["set-cookie"] : [response.headers["set-cookie"]];
        var sessionCookie = _.chain(cookieHeaders).filter(isSessionCookie).first().value().split(";")[0];
        body.sessionCookie = sessionCookie;
        cb(null, body);
      } else {
        cb('Error requesting report: ' + JSON.stringify(body));
      }

    });

  }

  function pollReportStatus(reportRequest, cb) {

    var options = {
      url: endpoint + "/rest_v2/reportExecutions/" + reportRequest.requestId,
      method: "GET",
      json: true,
      headers: {
        "Accept": "application/json",
        "Cookie": reportRequest.sessionCookie
      }
    };

    request(options, function(err, response, body) {
      if (err) {
        return cb(err);
      }

      if (response.statusCode === 200) {
        body.sessionCookie = reportRequest.sessionCookie;
        cb(null, body);
      } else {
        console.log(body);
        cb('Error fetching report request status: ' + JSON.stringify(body));
      }

    });

  }

  function fetchReportOutput(status, cb) {

    var options = {
      url: endpoint + "/rest_v2/reportExecutions/" + status.requestId + "/exports/" + status.exports[0].id + "/outputResource",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": status.sessionCookie
      }
    };

    request(options)
      .on('response', function(response) {

        if (response.statusCode === 200) {
          var through = es.through();
          through.pause();

          response.pipe(through);
          cb(null, through);

          process.nextTick(function() {
            through.resume();
          });

        } else {
          cb('Error fetching report output ');
        }

      })
      .on('error', function(error) {
        cb(error);
      });

  }

  function isDone(status) {
    return status.status === "ready";
  }

  function pollUntilDone(reportRequest) {
    var poll = Promise.promisify(pollReportStatus);

    return poll(reportRequest)
      .then(function(status) {
        if (isDone(status)) {
          return Promise.resolve(status);
        } else {
          return Promise.delay(reportRequest, pollingDelay)
            .cancellable()
            .then(pollUntilDone);
        }
      });
  }

  function runReport(name, path, params, cb) {
    var request = Promise.promisify(requestReport),
      fetch = Promise.promisify(fetchReportOutput);

    var poll;

    request(name, path, params)
      .then(function(reportRequest) {
        poll = pollUntilDone(reportRequest);
        return poll;
      })
      .cancellable()
      .catch(Promise.TimeoutError, function(error) {
        poll.cancel();
        throw error;
      })
      .timeout(requestTimeout, "Report polling timed out!")
      .then(fetch)
      .then(function(reportStream) {
        cb(null, reportStream);
      })
      .catch(function(error) {
        cb(error);
      });
  }

  return  {
    runReport: runReport
  };

};
