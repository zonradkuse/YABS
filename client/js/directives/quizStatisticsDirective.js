clientControllers.directive('quizStatistics', ['$timeout', 'rooms', function($timeout, rooms) {
    return {
        restrict: 'E',
        templateUrl: 'quiz_statistics.html',
        scope: {
            quiz: "="
        },
        link: {
            pre: function ($scope) {
                $scope.statistics = {};
                $scope.chartist = [];
                $scope.prepareQuizzes = function () {
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
                    for (var i = 0; i < $scope.quiz.questions.length; i++) {
                        var curQuizQuestion = $scope.quiz.questions[i];
                        var data = {
                            series : [[]],
                            labels : []
                        };
                        for (var j = 0; j < curQuizQuestion.quizQuestion.statistics.statisticAnswer.length; j++) {
                            var curStatAnswer = curQuizQuestion.quizQuestion.statistics.statisticAnswer[j];
                            data.labels.push(curStatAnswer.answer.description);
                            data.series[0].push(Number(curStatAnswer.count));
                        }
                        $scope.chartist[curQuizQuestion._id] = {};
                        $scope.chartist[curQuizQuestion._id].barData = data;
                        $scope.chartist[curQuizQuestion._id].barOptions = barOptions;
                        $scope.chartist[curQuizQuestion._id].barResponsiveOptions = barResponsiveOptions;
                    }
                };
            },
            post: function ($scope) {
                $('#quizStatisticsModal').off().on("show.bs.modal", function () {
                    rooms.getStatistics($scope.quiz, function (data) {
                        $scope.quiz = data;
                        $scope.prepareQuizzes();
                        $scope.$digest();
                        $timeout(function() {
                            window.dispatchEvent(new Event("resize"));
                            // Rerenders chartist (crappy solution, but the directive doesnt allow direct access)
                            return true;
                        }, 400);
                    });
                });
            }
        }
    };
}]);
