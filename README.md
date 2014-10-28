# Jasper-client

Client to access a [Jasper Report Server](https://community.jaspersoft.com/project/jasperreports-server) to be able to
 request to run a report.

Currently, uses the SOAP interface to run the `runReport` request.  Tested with Jasper Server version 4.1.0.

## Install

```
npm install http://github.com/jackruss/jasper-client
```

## Usage

### Configuration

Currently, the only configuration parameter is the url to the Jasper server itself.  If you are using basic auth to secure
the server, then embed it in the url.

```
var jasper = require('jasper-client');

var jasperUrl = 'http://user:pass@jasper.myserver.com';

var jasperClient = jasper({url: jasperUrl});

```


#### runReport(reportName, reportDirectory, reportParams, callback)

**Arguments**

* `reportName` - Name of the report
* `reportDirectory` - Directory where report is located
* `reportParams` - Report parameters represented as a JSON object
* `callback(err, result)` - A callback that is called when the report response is received.  The result will be a readable
stream if the report request is a success.

```
var fs = require('fs'),
  jasper = require('jasper-client');

var jasperUrl = 'http://jasper.myserver.com';

var jasperClient = jasper({url: jasperUrl});

var reportName = 'test_report';
var reportDirectory = '/Reports/directory';
var reportParams =  { foo: 'bar'};

var output = fs.createWriteStream('report.pdf');

jasperClient.runReport(reportName, reportDirectory, reportParams, function(err, result) {
  result.pipe(output);
});

```

