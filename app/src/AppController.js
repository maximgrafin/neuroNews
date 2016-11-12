/**
 * Main App Controller for the Angular Material Starter App
 * @param UsersDataService
 * @param $mdSidenav
 * @constructor
 */
function AppController(UsersDataService, $mdSidenav) {
    var self = this;

    self.selectedNews = null;
    self.news = [];
    self.selectNews = selectNews;

    self.users = [];
    self.selected = null;

    self.selectUser = selectUser;
    self.toggleList = toggleUsersList;

    // Load all registered users

    UsersDataService
        .loadAllUsers()
        .then(function (users) {
            self.users = [].concat(users);
            self.selected = users[0];
        });

    UsersDataService
        .loadAllNews()
        .then(function (news) {
            self.news = [].concat(news);
            self.selectedNews = news[0];
        });

    // *********************************
    // Internal methods
    // *********************************

    /**
     * Hide or Show the 'left' sideNav area
     */
    function toggleUsersList() {
        $mdSidenav('left').toggle();
    }

    /**
     * Select the current avatars
     * @param menuId
     */
    function selectUser(user) {
        self.selected = angular.isNumber(user) ? $scope.users[user] : user;
    }

    function selectNews(news) {
        self.selected = angular.isNumber(news) ? $scope.users[news] : news;
    }
}

export default ['UsersDataService', '$mdSidenav', AppController];
