//Lets require/import the HTTP module
var http = require('http');
var url = require('url');
var predictor = require('./predictiveservices');
var metaDataExtractor = require('./metaDataExtractor');

//Lets define a port we want to listen to
const PORT = 4567;

//We need a function which handles requests and send response
function handleRequest(request, response) {
    try {
        if (request.method === 'OPTIONS') {
            console.log('!OPTIONS');
            var headers = {};
            // IE8 does not allow domains to be specified, just the *
            // headers["Access-Control-Allow-Origin"] = req.headers.origin;
            headers["Access-Control-Allow-Origin"] = "*";
            headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
            headers["Access-Control-Allow-Credentials"] = false;
            headers["Access-Control-Max-Age"] = '86400'; // 24 hours
            headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
            response.writeHead(200, headers);
            response.end();
        } else {
            var requestData = '';
            request.on('data',
                function (data) {
                    requestData += data;
                });

            request.on('end', function () {
                console.log("HttpRequestBody=" + requestData);
                var requestObj = JSON.parse(requestData).meta;
                var meta = metaDataExtractor.getMetaData(requestObj);
                predictor.predictByMeta(meta, function (data) {
                    var headers = {};
                    headers["Access-Control-Allow-Origin"] = "*";
                    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
                    headers["Access-Control-Allow-Credentials"] = false;
                    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
                    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
                    response.writeHead(200, headers);
                    response.end(data);
                });
            });
        }
    } catch (err) {
        console.log(err);
        response.end('smth went wrong');
    }
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function () {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});