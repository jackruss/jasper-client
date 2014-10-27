"use strict";

var Dicer = require('dicer'),
    xml2js = require('xml2js'),
    es = require('event-stream');

module.exports = function(boundary, stream) {

  var through = es.through();

  var parts = [];

  var d = new Dicer({boundary: boundary});

  d.on('part', function(p) {

    p.on('header', function(header) {

      if (/^text\/xml/.test(header['content-type'][0])) {

        var xmlString = "";

        var xmlWriter = es.wait(function(err, text) {
          xmlString = text;
        });

        p.on('end', function() {

          xml2js.parseString(xmlString, function(err, results) {

            if (err) {
              through.emit('error', err);
            }

            if (results) {

              var runReportReturn = results["soapenv:Envelope"]["soapenv:Body"][0]["ns1:runReportResponse"][0]["runReportReturn"][0]["_"];

              xml2js.parseString(runReportReturn, function(err, results) {

                if (results) {
                  var returnCode = results["operationResult"]["returnCode"][0];
                  if (returnCode !== "0") {
                    through.emit('error', 'Error with report');
                  }
                }

              });

            }

          });

        });

        p.pipe(xmlWriter);

      } else if (header['content-id'][0] === '<report>') {
        p.pipe(through);
      }
    });

  });

  stream.pipe(d);

  return through;

};