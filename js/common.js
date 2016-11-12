module.exports={
    getJsonValue : function (obj, defaultValue)
    {
        defaultValue = defaultValue || 'null';
        if (obj === undefined || obj === null)
            return defaultValue;
        else
            return obj;
    },
    performRequest: function (url, path, method, headers, dataJson, success) 
    {
        var querystring = require('querystring');
        var https = require('https');
        
        if (method == 'GET') { path += '?' + dataJson; }

        var options = 
        {
            host: url,
            path: path,
            method: method,
            headers: headers
        };

        var req = https.request(options, function(res) 
        {
            res.setEncoding('utf-8');

            var responseString = '';

            res.on('data', function(data) { responseString += data;});

            res.on('end', function() {
            console.log("HttpResponse=" + responseString);
            var responseObject = JSON.parse(responseString);
            success(responseObject);
            });
        });

        req.write(dataJson);
        req.end();
    }
}