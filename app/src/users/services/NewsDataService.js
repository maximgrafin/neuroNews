import news from 'src/users/services/news';
import MetaDataExtractor from 'src/users/services/MetaDataExtractor';
import common from 'src/users/services/common';
import PredictiveServices from 'src/users/services/PredictiveServices';

function NewsDataService($q, $timeout, $http) {
    // Promise-based API
    var NewsDataService = {
        loadAllNews: function () {
            var deferred = $q.defer();
            MetaDataExtractor.readData(function (data) {
                deferred.resolve(data);
            });
            return deferred.promise;
        },
        updateStatus: function (news) {
            news.isLoading = true;
            return NewsDataService.isInteresting(news)
                .then(function (data) {
                    news.isInteresting = data.isInteresting;
                    news.loading = true;
                }).finally(function () {
                    news.isLoading = false;
                });
        },
        isInteresting: function (news) {
            $http.defaults.headers.post["Content-Type"] = "application/json";
            return $http({
                url: 'http://127.0.0.1:4567',
                method: "POST",
                data: {meta: news}
            }).then(function (data) {
                console.log("predictor:" + data);
                return {isInteresting: data.data == 1};
            });
            // ;
            // // var metadata = MetaDataExtractor.getMetaData(news).join(",");
            // $http.post("http://127.0.0.1:4567/", {meta: angular.toJson(news)})
            //     .then(function (data) {
            //         console.log("predictor:" + data);
            //     });

            PredictiveServices.predictEntryScore(news,
                function (data) {
                    console.log('Predicted=' + data);
                });


            var metadata = MetaDataExtractor.getMetaData(news).join("|");
            console.log(metadata);
            return $timeout(function () {
                return {
                    "isInteresting": Math.random() > 0.5
                };
            }, Math.floor(Math.random() * 5000));
        }
    };
    return NewsDataService;
}

export default ['$q', '$timeout', '$http', NewsDataService];

