"use strict";

var _ = require('underscore'),
    builder = require('xmlbuilder'),
    escape = require('escape-html');

function create(operation, args, descriptor) {
  var request = builder.create("request", {headless: true});

  request.att("operationName", operation);
  request.att("locale", "en");

  if (args) {
    _.each(args, function(value, key) {
      var argument = request.ele("argument");
      argument.att("name", key);
      argument.text(value);
    });
  }

  var resourceDescriptor = request.ele("resourceDescriptor");
  resourceDescriptor.att("name", descriptor.name || "");
  resourceDescriptor.att("wsType", descriptor.type || "");
  resourceDescriptor.att("uriString", descriptor.uri);

  var label = resourceDescriptor.ele("label");
  label.text(descriptor.label || "null");

  if (descriptor.params) {
    _.each(descriptor.params, function(value, key) {
      var parameter = resourceDescriptor.ele("parameter");
      parameter.att("name", key);
      parameter.text(value);
    });
  }

  return request.end();

}


function createReportRequest(body) {

  var request = builder.create("runReport", {headless: true});
  request.att("xmlns", "http://tempuri.org");

  var params = request.ele("requestXmlString");
  params.raw(body);

  return request.end();

}

module.exports = {

  runReport: function(name, path, params) {
    var reportParameters = create('runReport', {"RUN_OUTPUT_FORMAT": "PDF"}, {uri: path + "/" + name, params: params});
    return createReportRequest(escape(reportParameters));

  }


};