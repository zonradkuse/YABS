// This file is part of YABS. See License for more information

clientControllers.directive('pollStatistics', ['$timeout', 'rooms', "$rootScope", function($timeout, rooms, $rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'html/views/partials/ars/poll/poll_statistics.html',
        scope: {
            poll: "="
        },
        link: {
            pre: function ($scope) {
                $scope.statistics = {};
                $scope.chartist = {};

                var barOptions = {
                    seriesBarDistance: 1
                };
                var barResponsiveOptions = [
                    ['screen and (min-width: 641px) and (max-width: 1024px)', {
                        seriesBarDistance: 10,
                        axisX: {
                            labelInterpolationFnc: function(value) {
                                return value;
                            }
                        }
                    }],
                    ['screen and (max-width: 640px)', {
                        seriesBarDistance: 5
                    }]
                ];

                $scope.preparePolls = function () {
                    var data = {
                        series : [[]],
                        labels : []
                    };
                    for (var j = 0; j < $scope.statistics.statisticAnswer.length; j++) {
                        var curStatAnswer = $scope.statistics.statisticAnswer[j];
                        data.labels.push(curStatAnswer.answer.description);
                        data.series[0].push(Number(curStatAnswer.count));
                    }
                    $scope.chartist.barData = data;
                    $scope.chartist.barOptions = barOptions;
                    $scope.chartist.barResponsiveOptions = barResponsiveOptions;

                    $timeout(function() {
                        window.dispatchEvent(new Event("resize"));
                        // Rerenders chartist (crappy solution, but the directive doesnt allow direct access)
                        return true;
                    }, 400);
                };
            },
            post: function ($scope) {
                var init = function(){
                    if (!$scope.poll || ($scope.poll && !$scope.poll._id)) {
                        $scope.poll = $rootScope.newPoll;
                    }
                    if ($scope.poll) {
                        rooms.getPollStatistics($scope.poll, function (data) {
                            $scope.statistics = data.poll.statistics;
                            $scope.preparePolls();
                            $scope.$digest();
                        });
                    }
                };
                $scope.interval = setInterval(init, 7000);
                $scope.$on("$destroy", function() {
                    clearInterval($scope.interval);
                });
                init();
            }
        }
    };
}]);
