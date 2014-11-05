var nock = require('nock'),
    expect = require('expect.js'),
  url = require('url'),
  es = require('event-stream');

describe('soap', function () {

  before(function() {
    nock.disableNetConnect();
  });

  afterEach(function() {
    nock.cleanAll();
  });

  after(function() {
    nock.restore();
  });

  var soap = require('../lib/soapService');

  it('should make soap request', function (done) {

    var endpoint = 'http://user:pw@test.com/service',
        method = 'method',
        client = soap(endpoint);

    var parsedEndpoint = url.parse(endpoint);

    var response = "stuff";

    nock(parsedEndpoint.protocol + "//" + parsedEndpoint.hostname, {
      reqheaders: {
        "Content-Type": "text/xml",
        "SOAPAction": '"http://' + parsedEndpoint.hostname + parsedEndpoint.pathname + '/' + method + '"'
      }
    })
      .post(parsedEndpoint.pathname)
      .reply(200, response);

    var body = '<sample></sample>';

    var writer = es.writeArray(function(err, array) {
      expect(err).not.to.be.ok();
      expect(array).to.be.ok();
      expect(array).to.have.length(1);
      expect(array[0].toString()).to.be(response);
      done();
    });

    client.call(method, body, function(err, result) {
      expect(err).not.to.be.ok();
      expect(result).to.be.ok();
      expect(result.readable).to.be.ok();
      result.pipe(writer);
    });

  });

});