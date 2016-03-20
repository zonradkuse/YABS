// This file is part of YABS. See License for more information

clientControllers.directive('question', ['$timeout', 'rooms', "$rootScope", function($timeout, rooms, $rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'html/views/partials/course_question.html',
        scope: {
            room: "=",
            showAdmin: "=",
            question: "="
        },
        link: function ($scope) {
            $scope.Math = window.Math;
            $scope.imageUploads = {};
            $scope.uploading = {};

            $scope.addAnswer = function(question) {
                if($scope.imageUploads[question._id] === undefined) {
                    $scope.imageUploads[question._id] = [];
                }
                rooms.addAnswer($scope.room, question, this.answerText[question._id], $scope.imageUploads[question._id]);
                this.answerText[question._id] = "";
                $scope.imageUploads[question._id] = undefined;
            };

            $scope.voteQuestion = function(question) {
                rooms.voteQuestion($scope.room, question);
            };

            $scope.markAsAnswer = function(question, answer) {
                rooms.markAsAnswer($scope.room, question, answer);
            };

            $scope.deleteQuestion = function(question) {
                rooms.deleteQuestion($scope.room, question);
            };

            $scope.deleteAnswer = function(question, answer) {
                rooms.deleteAnswer($scope.room, question, answer);
            };
        }
    };
}]);
