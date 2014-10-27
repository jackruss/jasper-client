'use strict';

module.exports = function(soapClient, requests) {

  function runReport(name, path, params, cb) {

    var request = requests.runReport(name, path, params);

    return soapClient.call('runReport', request, cb);
  }

  return {
    runReport: runReport
  };

};