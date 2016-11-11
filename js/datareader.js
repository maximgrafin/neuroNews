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
        getPredictionServiceJson(entry);
        var row = metadata.join(',');
        fs.appendFileSync('./output/out.txt', row + '\n');
        console.log(entry.id + ',' + row);
    }
};