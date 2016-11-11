module.exports =
{
    readData: function () {
        var firebase = require('firebase');
        var Promise = require('promise');
        var escape = require('escape-html');

        firebase.initializeApp({databaseURL: "https://dpahthon1611.firebaseio.com"});
        var bdt_ref = firebase.database().ref('/feuerfrei/aufschaltung/ht0/feed/wire/article/dpasrv_bdt/latest/entries');

        bdt_ref.limitToLast(10).on('value', show);
    }
}

function show(snapshot) {
    var metaDataExtractor = require('./metaDataExtractor');
    var entries = snapshot.val();
    for (var k in entries) {
        var entry = entries[k];
        console.log(metaDataExtractor.getMetaData(entry).join('|')
            + "\n"
            + entry.title.replace("\n", "")
            + "\n"
        );
        //   console.log(entry.updated
        // + "|" + entry.id
        // + "|" + entry.title.replace("\n", "")
        // + "|" + entry.description
        // + '|' + metaDataExtractor.getMetaData(entry).join('|')
        // + "\n");
    }
};