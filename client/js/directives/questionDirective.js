clientControllers.directive('question', ['$timeout', 'rooms', "$rootScope", function($timeout, rooms, $rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'course_question.html',
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

            $scope.uploadImage = function($event, identifier) {
                // Actually this should be an ng-directive, needs refactoring at some point of time
                var fileInput = jQuery($event.currentTarget.children[0]);
                fileInput.off().on("change", function() {
                    var formData = new FormData();
                    formData.append("image", this.files[0]);
                    $scope.uploading[identifier] = true;
                    $http.post("upload", formData, {
                        headers: {
                            "Content-Type" : undefined
                        },
                        transformRequest: angular.identity
                    }).then(function(response) {
                        if("error" in response) {
                            alert(response.error);
                            $scope.uploading[identifier] = false;
                        }
                        else {
                            if($scope.imageUploads[identifier] === undefined) {
                                $scope.imageUploads[identifier] = [];
                            }
                            $scope.imageUploads[identifier].push(response.data);
                            $scope.uploading[identifier] = false;
                        }
                    });
                });
                $timeout(function() { // Without this the event will be triggered in the current digest, which might blow up things
                    fileInput.click(); // and causes an exception
                    return true;
                });
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
