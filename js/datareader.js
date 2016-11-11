module.exports =
{
    readData: function () {
        var firebase = require('firebase');
        var Promise = require('promise');
        var escape = require('escape-html');

        firebase.initializeApp({databaseURL: "https://dpahthon1611.firebaseio.com"});
        var bdt_ref = firebase.database().ref('/feuerfrei/aufschaltung/ht0/feed/wire/article/dpasrv_bdt/latest/entries');

        bdt_ref.limitToLast(100).on('value', show);
    }
};

function show(snapshot) {
    var metaDataExtractor = require('./metaDataExtractor');
    var fs = require('fs');
    var entries = snapshot.val();
    fs.writeFileSync('./output/out.txt', "");
    for (var k in entries) {
        var entry = entries[k];
        var metadata = metaDataExtractor.getMetaData(entry).join(',');
        var row = '1,' + metadata + ',' + entry.title.replace(/[\n\,]/g, '') ;
        fs.appendFileSync('./output/out.txt', row + '\n');
        console.log(entry.id + ',' + row);
    }
};