//Lets require/import the HTTP module
var http = require('http');
var url = require('url');
var predictor = require('./predictiveservices');


//Lets define a port we want to listen to
const PORT = 4567;

//We need a function which handles requests and send response
function handleRequest(request, response) {
    try {
        // response request.
        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;
        var meta = query.meta.split(",");
        predictor.predictByMeta(meta, function (data) {
            response.end('It Works!' + data);
        });
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