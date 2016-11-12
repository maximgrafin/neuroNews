var predictiveservices = require('../../js/predictiveservices');
var common = require('../../js/common');
var metaDataExtractor = require('../../js/metaDataExtractor');

function ShowData()
{
    var firebase = require('firebase');
    var Promise = require('promise');
    var escape = require('escape-html');

    firebase.initializeApp({databaseURL: "https://dpahthon1611.firebaseio.com"});
    var bdt_ref = firebase.database().ref('/feuerfrei/aufschaltung/ht0/feed/wire/article/dpasrv_bdt/latest/entries');

    bdt_ref.limitToLast(2).on('value', show);
}

function show(snapshot) 
{
    var entries = snapshot.val();
    for (var k in entries) 
    {
        var pieceOfNews = entries[k];
        var metadata = metaDataExtractor.getMetaData(pieceOfNews);
        var row = metadata.map(x => common.getJsonValue(x)).join(',');
        //change color here or something
        predictiveservices.predictEntryScore(entry, function(data) {console.log('Predicted=' + data);});
    }
};



function AppController(NewsDataService) {
    var self = this;

    self.selectedNews = null;
    self.newsList = [];
    self.selectNews = selectNews;

    // Load all registered users

    NewsDataService
        .loadAllNews()
        .then(function (newsList) {
            self.newsList = [].concat(newsList);
            // self.selectedNews = newsList[0];
            angular.forEach(self.newsList, function(news){
                NewsDataService.updateStatus(news);
            });
        });

    function selectNews(news) {
        self.selectedNews = news;
    }
}

export default ['NewsDataService', '$mdSidenav', AppController];
