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
    var path = '/workspaces/47d4f830adac4031953eadd43c9f816f/services/e906063e6aff4920a0d1e479798912e1/execute?api-version=2.0&format=swagger';
    var api_key = 'hlXQ8mZXAjCX+BTH7V0fv4z03KfxGMDgoL0v/VNS33XdXfT2Z/DLOJhzMhHzpcKBxVM6rwQ/onUrflw+y5PHlA==';
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