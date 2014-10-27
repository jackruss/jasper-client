"use strict";

var soap = require('./lib/soap'),
  requests = require('./lib/requests');

module.exports = function(options) {

  if (!options || !options.url) {
    throw new Error('Must supply url for jasper server');
  }

  return require('./lib/client')(soap(options.url), requests);
};