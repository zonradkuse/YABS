(function() {
    clientControllers.controller('courseController', ['$scope', '$routeParams',  'rooms', '$location', 'authentication',
        function($scope, $routeParams, rooms, $location, authentication) {
            authentication.enforceLoggedIn();

            $scope.$watch(function() { return rooms.getById($routeParams.courseid); }, function(room) {
                $scope.room = room;
                if($scope.room !== undefined) { // Happens while loading
                    rooms.enter($scope.room);
                    rooms.getQuestions($scope.room);
                }
            });
            
            $scope.$watch("room", function(room) {
                for (var i = 0; room !== undefined && i < room.questions.length; i++) {
                    room.questions[i].elapsedSince =  (Date.now() - Date.parse(room.questions[i].creationTime)) / (1000 * 60);
                    room.questions[i].elapsedSince = Math.ceil(room.questions[i].elapsedSince);
                    for (var j = 0; j < room.questions[i].answers.length; j++) {
                      room.questions[i].answers[j].elapsedSince =  (Date.now() - Date.parse(room.questions[i].answers[j].creationTime)) / (1000 * 60);
                      room.questions[i].answers[j].elapsedSince = Math.ceil(room.questions[i].answers[j].elapsedSince);
                    }
                }
            }, true);

            $scope.addQuestion = function() {
                rooms.addQuestion($scope.room, this.questionText);
                this.questionText = "";
            };
            $scope.addAnswer = function(question) {
                rooms.addAnswer($scope.room, question, this.answerText[question._id]);
                this.answerText[question._id] = "";
            };            
        }
    ]);

})();