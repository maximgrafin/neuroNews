function AppController(NewsDataService) {
    var self = this;

    self.isLoading = false;
    self.selectedNews = null;
    self.newsList = [];
    self.selectNews = selectNews;
    self.showColors = false;

    // Load all registered users

    self.isLoading = true;
    NewsDataService
        .loadAllNews()
        .then(function (newsList) {
            self.isLoading = false;
            self.newsList = [].concat(newsList);
            // self.selectedNews = newsList[0];
            angular.forEach(self.newsList, function (news) {
                NewsDataService.updateStatus(news);
            });
        });

    function selectNews(news) {
        self.selectedNews = news;
    }
}

export default ['NewsDataService', '$mdSidenav', AppController];
