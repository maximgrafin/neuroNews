var datareader = require('./datareader');
//datareader.readData();

    var firebase = require('firebase');
    var Promise = require('promise');
    var escape = require('escape-html');

    firebase.initializeApp({ databaseURL: "https://dpahthon1611.firebaseio.com"});
    var bdt_ref = firebase.database().ref('/feuerfrei/aufschaltung/ht0/feed/rubric/dpanews_intl_news/entries');

    bdt_ref.limitToLast(100).on('value', show);

    function show(snapshot) 
{
  var entries = snapshot.val();
  for (var k in entries) 
  {
    console.log(entries[k].title + "\n");
  }
};