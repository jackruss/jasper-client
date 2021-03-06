"use strict";

var url = require('url'),
    builder = require('xmlbuilder'),
    request = require('request'),
    splitter = require('./multipartSplitter'),
    es = require('event-stream');

var RE_BOUNDARY = /^multipart\/.+?(?:;\s+boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;

function getBoundary(response) {
  var matcher = RE_BOUNDARY.exec(response.headers['content-type']);
  return matcher ? matcher[1] : null;
}

module.exports = function(endpoint) {

  var parsedUrl = url.parse(endpoint);

  function createEnvelope(body) {

    var envelope = builder.create('soap:Envelope', {headless: true});
    envelope.att('xmlns:soap', "http://schemas.xmlsoap.org/soap/envelope/");
    envelope.ele("soap:Header");
    var bodyTag = envelope.ele("soap:Body");

    bodyTag.raw(body);

    return envelope.end();

  }

  function sendRequest(method, envelope, cb) {

    var options = {
      url: endpoint,
      method: 'POST',
      body: envelope,
      headers: {
        "Content-Type": "text/xml",
        "SOAPAction": '"http://' + parsedUrl.hostname + parsedUrl.pathname + '/' + method + '"'
      }
    };

    request(options)
      .on('response', function(response) {

        if (response.statusCode !== 200 || /^text\/xml/.test(response.headers['content-type'])) {
          var errorWriter = es.wait(function(err, text) {
            cb("Unexpected result from jasper server: status(" + response.statusCode + ") content-type(" + response.headers["content-type"] + ") Body: " + text);
          });
          response.pipe(errorWriter);
          return;
        }

        var through = es.through();

        var boundary = getBoundary(response);

        if (boundary) {
          splitter(boundary, response).pipe(through);
        } else {
          response.pipe(through);
        }

        cb(null, through);

      })
      .on('error', function(err) {
        cb(err);
      });

  }

  function call(method, body, cb) {
    var envelope = createEnvelope(body);
    sendRequest(method, envelope, cb);
  }

  return  {
    call: call
  };

};