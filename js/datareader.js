module.exports =
{
    readData: function () {
        var firebase = require('firebase');
        var Promise = require('promise');
        var escape = require('escape-html');

        firebase.initializeApp({databaseURL: "https://dpahthon1611.firebaseio.com"});
        var bdt_ref = firebase.database().ref('/feuerfrei/aufschaltung/ht0/feed/wire/article/dpasrv_bdt/latest/entries');

        bdt_ref.limitToLast(1).on('value', show);

        console.log('hello world');
    }
};

var cognitiveservices = require('./cognitiveservices');
var common = require('./common');
var metaDataExtractor = require('./metaDataExtractor');
var predictiveservices = require('./predictiveservices');

function show(snapshot) 
{
    var fs = require('fs');
    var entries = snapshot.val();
    fs.writeFileSync('./output/out.txt', "");
    for (var k in entries) 
    {
        var pieceOfNews = entries[k];
        var metadata = metaDataExtractor.getMetaData(pieceOfNews);
        var row = metadata.map(x => common.getJsonValue(x)).join(',');
        fs.appendFileSync('./output/out.txt', row + '\n');
        console.log(pieceOfNews.id + ',' + row);
        predictiveservices.predictByMeta(metadata, function(data) {console.log('Predicted=' + data);});
    }
};