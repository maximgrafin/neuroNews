var common = require('./common');
var metaDataExtractor = require('./metaDataExtractor');

module.exports =
{
    predictEntryScore: function(pieceOfNews, scoredLabels)
    {
        getPrediction(pieceOfNews, scoredLabels);
    },
    predictByMeta: getPredictionByMeta
};

function getPrediction(pieceOfNews, callback){
    var metadata = metaDataExtractor.getMetaData(pieceOfNews);
    return getPrediction(metadata, callback);
}

function getPredictionByMeta(metadata, callback)
{
    var url = 'europewest.services.azureml.net';
    var path = '/subscriptions/cf985d35a3854e0c8173015d3117c7b9/services/0e3760dc6d77427db34a4bba6de3739e/execute?api-version=2.0&format=swagger';
    var api_key = '1ZbV+IxOYsvWFOv9/PWITYFnbv6tYJOLhefzgMXhNNrbgUqxVbrK7KI3UiSxXPjVhcAepEiugziVlTaWH6k+Jw==';
    var headers = { 'Content-Type':'application/json', Authorization: 'Bearer '+ api_key};

    common.performRequest(url, path, 'POST', headers, getPredictionServiceJson(metadata), function(data)
    {
        try {
            console.log('Scored labels:', data.Results.output1[0]['Scored Labels']);
            callback(data.Results.output1[0]['Scored Labels']);
        }catch(err){
            console.error(err);
            callback(null);
        }
    });
}

function getPredictionServiceJson(metadata)
{
    var text = '{ "Inputs": { "input1":  [ { ';
    for (i = 0; i < metadata.length; i++) { 
        text += '\'Col' + (i+1) + '\':\"' + common.getJsonValue(metadata[i])  + '",';
    }
    text = text.substring(0, text.length - 1);
    text += '} ], },"GlobalParameters":  { } }';
    console.log(text);

    return text;
}