"use strict";

var soapService = require('./lib/soapService'),
  soapRequests = require('./lib/soapRequests');

module.exports = function(options) {

  if (!options || !options.url) {
    throw new Error('Must supply url for jasper server');
  }

  if (options.soap === true) {
    return require('./lib/soapClient')(soapService(options.url), soapRequests);
  } else {
    return require('./lib/restClient')(options.url);
  }

};