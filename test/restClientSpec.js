var expect = require('expect.js'),
  nock = require('nock'),
  Promise = require('bluebird'),
  es = require('event-stream');

describe('rest', function () {

  var rest = require('../lib/restClient');

  before(function() {
    nock.disableNetConnect();
  });

  after(function() {
    nock.enableNetConnect();
  });

  it('should error if no endpoint supplied', function () {
    expect(rest).to.throwError();
  });

  it('should return error if initial request fails', function(done) {
    var endpoint = 'http://jasper';

    var client = rest(endpoint, 100);

    var jasper = nock(endpoint)
      .post("/rest_v2/reportExecutions")
      .reply(401, {error: "Unauthorized"});

    client.runReport('testReport', '/report/samples/', { "id": "123"}, function(err, result) {
      expect(err).to.be.ok();
      expect(result).not.to.be.ok();
      jasper.done();
      done();
    });

  });
  
  it('should return an error if poll request fails', function(done) {
    var endpoint = 'http://jasper';

    var client = rest(endpoint, 100);

    var reportRequest = {
      status: "queued",
      requestId: "1e9aaa54-4e57-46e9-bb09-ac1ffea61aaf"
    };

    var jasper = nock(endpoint)
      .post("/rest_v2/reportExecutions")
      .reply(200, reportRequest, { "Content-Type": "application/json", "Set-Cookie": "JSESSIONID=ABC123; HttpOnly" })
      .get("/rest_v2/reportExecutions/" + reportRequest.requestId)
      .reply(500);

    client.runReport('testReport', '/report/samples/', { "id": "123"}, function(err, result) {
      expect(err).to.be.ok();
      expect(result).not.to.be.ok();
      jasper.done();
      done();
    });
  });

  it('should return an error if poll request loop times out', function(done) {
    var endpoint = 'http://jasper';

    var client = rest(endpoint, 100);

    var reportRequest = {
      status: "queued",
      requestId: "2e9aaa54-4e57-46e9-bb09-ac1ffea61aaf"
    };

    var reportStatus = {
      status: "pending",
      requestId: "2e9aaa54-4e57-46e9-bb09-ac1ffea61aaf"
    };

    var jasper = nock(endpoint)
      .post("/rest_v2/reportExecutions")
      .reply(200, reportRequest, { "Content-Type": "application/json", "Set-Cookie": "JSESSIONID=ABC123; HttpOnly" })
      .get("/rest_v2/reportExecutions/" + reportRequest.requestId)
      .reply(200, reportStatus);

    client.runReport('testReport', '/report/samples/', { "id": "123"}, function(err, result) {
      expect(err).to.be.ok();
      expect(err).to.be.a(Promise.TimeoutError);
      expect(result).not.to.be.ok();
      jasper.done();
      done();
    });
  });

  it('should succeed if status is ready after first poll', function(done) {
    var endpoint = 'http://jasper';

    var client = rest(endpoint, 1000);

    var reportRequest = {
      status: "queued",
      requestId: "1e9aaa54-4e57-46e9-bb09-ac1ffea61aaf"
    };

    var reportStatus = {
      status: "ready",
      requestId: "1e9aaa54-4e57-46e9-bb09-ac1ffea61aaf",
      exports: [
        {
          id: "1e9FED54-4e57-46e9-bb09-ac1ffea61aaf"
        }
      ]
    };

    var jasper = nock(endpoint)
      .post("/rest_v2/reportExecutions")
      .reply(200, reportRequest, { "Content-Type": "application/json", "Set-Cookie": "JSESSIONID=ABC123; HttpOnly" })
      .get("/rest_v2/reportExecutions/" + reportRequest.requestId)
      .reply(200, reportStatus, { "Content-Type": "application/json"})
      .get("/rest_v2/reportExecutions/" + reportStatus.requestId + "/exports/" + reportStatus.exports[0].id + "/outputResource")
      .reply(200, "this is a test string");

    client.runReport('testReport', '/report/samples/', { "id": "123"}, function(err, result) {
      expect(err).not.to.be.ok();
      expect(result).to.be.ok();
      expect(result.readable).to.be(true);

      var writer = es.writeArray(function(err, array) {
        expect(array[0].toString()).to.eql("this is a test string");
        jasper.done();
        done();
      });

      result.pipe(writer);

    });
  });

  it('should succeed if status is ready after second poll', function(done) {

    var endpoint = 'http://jasper';

    var client = rest(endpoint, 1000, 250);

    var reportRequest = {
      status: "queued",
      requestId: "3e9aaa54-4e57-46e9-bb09-ac1ffea61aaf"
    };

    var reportStatusPending = {
      status: "pending",
      requestId: "3e9aaa54-4e57-46e9-bb09-ac1ffea61aaf",
      exports: [
        {
          id: "3e9FED54-4e57-46e9-bb09-ac1ffea61aaf"
        }
      ]
    };

    var reportStatusReady = {
      status: "ready",
      requestId: "3e9aaa54-4e57-46e9-bb09-ac1ffea61aaf",
      exports: [
        {
          id: "3e9FED54-4e57-46e9-bb09-ac1ffea61aaf"
        }
      ]
    };

    var jasper = nock(endpoint)
      .post("/rest_v2/reportExecutions")
      .reply(200, reportRequest, { "Content-Type": "application/json", "Set-Cookie": "JSESSIONID=ABC123; HttpOnly" })
      .get("/rest_v2/reportExecutions/" + reportRequest.requestId)
      .reply(200, reportStatusPending, { "Content-Type": "application/json" })
      .get("/rest_v2/reportExecutions/" + reportRequest.requestId)
      .reply(200, reportStatusReady, { "Content-Type": "application/json" })
      .get("/rest_v2/reportExecutions/" + reportStatusReady.requestId + "/exports/" + reportStatusReady.exports[0].id + "/outputResource")
      .reply(200, "this is a test string");

    client.runReport('testReport', '/report/samples/', { "id": "123"}, function(err, result) {
      expect(err).not.to.be.ok();
      expect(result).to.be.ok();
      expect(result.readable).to.be(true);

      var writer = es.writeArray(function(err, array) {
        expect(array[0].toString()).to.eql("this is a test string");
        jasper.done();
        done();
      });

      result.pipe(writer);

    });
  });

  it('should reject if status is failed after first poll', function(done) {
    var endpoint = 'http://jasper';

    var client = rest(endpoint, 1000);

    var reportRequest = {
      status: "queued",
      requestId: "1e9aaa54-4e57-46e9-bb09-ac1ffea61aaf"
    };

    var reportStatus = {
      status: "failed",
      errorDescriptor: {
        message: "Failed report",
        errorCode: "error",
        parameters: [
          "stack trace here"
        ]
      }
    };

    var jasper = nock(endpoint)
      .post("/rest_v2/reportExecutions")
      .reply(200, reportRequest, { "Content-Type": "application/json", "Set-Cookie": "JSESSIONID=ABC123; HttpOnly" })
      .get("/rest_v2/reportExecutions/" + reportRequest.requestId)
      .reply(200, reportStatus, { "Content-Type": "application/json"});

    client.runReport('testReport', '/report/samples/', { "id": "123"}, function(err, result) {
      expect(err).to.be.ok();
      expect(result).not.to.be.ok();
      jasper.done();
      done();
    });
  });

});