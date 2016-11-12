/**
 * Users DataService
 * Uses embedded, hard-coded data model; acts asynchronously to simulate
 * remote data service call(s).
 *
 * @returns {{loadAll: Function}}
 * @constructor
 */

import news from 'src/users/services/news';

function NewsDataService($q, $timeout) {
    // Promise-based API
    var NewsDataService = {
        loadAllNews: function () {
            angular.forEach(news, function (n) {
                n.isInteresting = false;
            });
            return $q.when(news)
        },
        updateStatus: function (news) {
            news.isLoading = true;
            return NewsDataService.isInteresting(news)
                .then(function (data) {
                    news.isInteresting = data.isInteresting;
                }).finally(function () {
                    news.isLoading = false;
                });
        },
        isInteresting: function (news) {
            return $timeout(function () {
                return {
                    "isInteresting": Math.random() > 0.5
                };
            }, Math.floor(Math.random() * 5000));
        }
    };
    return NewsDataService;
}

export default ['$q', '$timeout', NewsDataService];

