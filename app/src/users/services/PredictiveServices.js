var common = require('src/users/services/common');
var MetaDataExtractor = require('src/users/services/MetaDataExtractor');

module.exports =
{
    predictEntryScore: function (pieceOfNews, scoredLabels) {
        getPrediction(pieceOfNews, scoredLabels);
    }
};

function getPrediction(pieceOfNews, scoredLabels) {

}

function getPredictionServiceJson(pieceOfNews) {
    var metadata = MetaDataExtractor.getMetaData(pieceOfNews);
    var text = '{ "Inputs": { "input1":  [ { ';
    for (i = 0; i < metadata.length; i++) {
        text += '\'Col' + (i + 1) + '\':\"' + common.getJsonValue(metadata[i]) + '",';
    }
    text = text.substring(0, text.length - 1);
    text += '} ], },"GlobalParameters":  { } }';
    console.log(text);

    return text;
}