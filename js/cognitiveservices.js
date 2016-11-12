var common = require('./common');

module.exports =
{
    extractKeywords: function(pieceOfNews, keywords)
    {
        getKeywords(pieceOfNews, keywords);
    }
};

var url = 'westus.api.cognitive.microsoft.com';
var api_key = '006e0468be37472aa12a2bf687b77fe6';
var headers = { 'Content-Type':'application/json', 'Ocp-Apim-Subscription-Key': api_key};

function getKeywords(pieceOfNews, keywords)
{
    var path = '/text/analytics/v2.0/keyPhrases';

    common.performRequest(url, path, 'POST', headers, getKeywordRequestJson(pieceOfNews), function(data) 
    {
        keywords(data.documents[0].keyPhrases);
    });   
}

function getKeywordRequestJson(pieceOfNews)
{
    return '{ "documents": [ { "language": "de", "id": "xxx", "text": ' + JSON.stringify(pieceOfNews.title + ' ' + common.getJsonValue(pieceOfNews.description, ' ')) + ' } ] }';
}

function getTopics(pieceOfNews, topics)
{
    var path = '/text/analytics/v2.0/topics';
    common.performRequest(url, path, 'POST', headers, getTopicsRequestJson(pieceOfNews), function(data) 
    {
        topics(data.documents[0]);
    }); 
}

function getTopicsRequestJson(pieceOfNews)
{
    return '{ "stopWords": ["string"], "topicsToExclude": [ "string"], "documents": [ { "id": "string", "text": ' + JSON.stringify(pieceOfNews.content) + ' } ] }';
}