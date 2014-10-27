var expect = require('expect.js'),
  sinon = require('sinon'),
  es = require('event-stream');

describe('client', function () {

  var client = require('../lib/client');

  it('should run a report', function (done) {

    var mockReportStream = es.readArray(["foo"]);

    var mockSoap = {
      call: sinon.stub().yields(null, mockReportStream)
    };

    var mockRequests = {
      runReport: sinon.stub().returns("bar")
    };

    var jasper = client(mockSoap, mockRequests);

    var writer = es.writeArray(function(err, array) {
      done();
    });

    jasper.runReport('test_report', '/Reports/directory', { foo: 'bar'}, function(err, result) {
      expect(err).not.to.be.ok();
      result.pipe(writer);
    });

  });

});