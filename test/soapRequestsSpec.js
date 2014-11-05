var expect = require('expect.js'),
  fs = require('fs'),
  escape = require('escape-html');

describe('requests', function () {

  var requests = require('../lib/soapRequests');

  it('should create runReport request', function () {
    var result = requests.runReport('users_report', '/Reports/directory', { "users": "1" });

    var expectedParams = fs.readFileSync(__dirname + "/runReportRequest.xml").toString().replace(/^\s+/gm, "").replace(/\n/g, "");

    var expected = '<runReport xmlns="http://tempuri.org"><requestXmlString>' + escape(expectedParams) + '</requestXmlString></runReport>';

    expect(result).to.be(expected);
  });

});