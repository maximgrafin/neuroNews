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
