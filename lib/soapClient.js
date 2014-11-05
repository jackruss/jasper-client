'use strict';

module.exports = function(soapService, requests) {

  function runReport(name, path, params, cb) {

    var request = requests.runReport(name, path, params);

    return soapService.call('runReport', request, cb);
  }

  return {
    runReport: runReport
  };

};