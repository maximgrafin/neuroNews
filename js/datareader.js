module.exports =
{
    readData: function () {
        var firebase = require('firebase');
        var Promise = require('promise');
        var escape = require('escape-html');

        firebase.initializeApp({databaseURL: "https://dpahthon1611.firebaseio.com"});
        var bdt_ref = firebase.database().ref('/feuerfrei/aufschaltung/ht0/feed/wire/article/dpasrv_bdt/latest/entries');

        bdt_ref.limitToLast(100).on('value', show);

        console.log('hello world');
    }
};

function getDataAsArray(entry)
{
    var metadata;
    var metaDataExtractor = require('./metaDataExtractor');
    metadata = metaDataExtractor.getMetaData(entry);
    metadata.unshift(1);
    metadata.push(entry.title.replace(/[\n\,]/g, ''));
    return metadata;
}

function getPrediction(entry)
{
    var url = 'https://europewest.services.azureml.net/workspaces/47d4f830adac4031953eadd43c9f816f/services/e906063e6aff4920a0d1e479798912e1/execute?api-version=2.0&format=swagger';
    var api_key = 'hlXQ8mZXAjCX+BTH7V0fv4z03KfxGMDgoL0v/VNS33XdXfT2Z/DLOJhzMhHzpcKBxVM6rwQ/onUrflw+y5PHlA==';
    var headers = { 'Content-Type':'application/json', Authorization: 'Bearer '+ api_key};
    
    performRequest(url, 'POST', headers, getPredictionServiceJson(entry), function(data) {
    sessionId = data.result.id;
    console.log('Logged in:', sessionId);
  });
}

function performRequest(endpoint, method, headers, data, success) 
{
  var querystring = require('querystring');
  var https = require('https');

  var dataString = JSON.stringify(data);
  
  if (method == 'GET') 
  {
    endpoint += '?' + querystring.stringify(data);
  }

  var options = 
  {
    host: host,
    path: endpoint,
    url: end //fix here
        method: method,
    headers: headers
  };

  var req = https.request(options, function(res) 
  {
    res.setEncoding('utf-8');

    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      console.log(responseString);
      var responseObject = JSON.parse(responseString);
      success(responseObject);
    });
  });

  req.write(dataString);
  req.end();
}

function getPredictionServiceJson(entry)
{
    var metadata = getDataAsArray(entry);
    var text = '{ "Inputs": { "input1":  [ { ';
    for (i = 0; i < metadata.length; i++) { 
        text += '\'Col' + (i+1) + '\':\"' + metadata[i]  + '",';
    }
    text = text.substring(0, text.length - 1);
    text += '} ], },"GlobalParameters":  { } }';
    console.log(text);

    return text;
}

function show(snapshot) 
{
    var fs = require('fs');
    var entries = snapshot.val();
    fs.writeFileSync('./output/out.txt', "");
    for (var k in entries) 
    {
        var entry = entries[k];
        var metadata = getDataAsArray(entry);
        getPrediction(entry);
        var row = metadata.join(',');
        fs.appendFileSync('./output/out.txt', row + '\n');
        console.log(entry.id + ',' + row);
    }
};