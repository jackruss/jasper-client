var expect = require('expect.js'),
  fs = require('fs'),
  es = require('event-stream');

describe('multipartSplitter', function () {

  var splitter = require('../lib/multipartSplitter');

  it('should split a multipart stream', function (done) {
    var boundary = "----=_Part_257363_1000674874.1414072259780";

    var stream = fs.createReadStream(__dirname + "/multipartExample.txt");

    var writer = es.writeArray(function(err, array) {
      expect(err).not.to.be.ok();
      expect(array).to.have.length(1);
      expect(array[0]).to.be.a(Buffer);
      done();
    });

    splitter(boundary, stream).pipe(writer);

  });

});