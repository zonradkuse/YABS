clientControllers.controller("courseController", ["$scope", "$routeParams", "rooms", "$location", "authentication", "rpc", "$timeout", "$http",
    function($scope, $routeParams, rooms, $location, authentication, rpc, $timeout, $http) {
        authentication.enforceLoggedIn();

        $scope.$watch(function() { return rooms.getById($routeParams.courseid); }, function(room) {
            $scope.room = room;

            $scope.panics = 0;
            rpc.attachFunction("room:livePanic", function(data) {
                $scope.$apply(function() {
                    $scope.panics = data.panics;
                });
            });

            rpc.attachFunction("room:panicStatus", function(data) {
                $scope.$apply(function() {
                    $scope.room.isRoomRegistered = data.isEnabled;
                });  
            }); 

            if($scope.room !== undefined) { // Happens while loading
                rooms.hasUserAccess($scope.room).then(function(allowed) {
                    if(!allowed) {
                        $window.location = "/";
                    }
                });
                rooms.enter($scope.room);
                rooms.getQuestions($scope.room);

                rooms.getAccessLevel($scope.room).then(function(level) {
                    if(level > 1) {
                        $scope.showAdmin = true;
                    }
                    else {
                        $scope.showAdmin = false;
                    }    
                });
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

        $scope.voteQuestion = function(question) {
            rooms.voteQuestion($scope.room, question);
        };

        $scope.panic = function() {
            rooms.panic($scope.room);
            $scope.room.hasUserPanic = true;
        };

        $scope.unpanic = function() {
            rooms.unpanic($scope.room);
            $scope.room.hasUserPanic = false;
        };

        $scope.enableRoom = function() {
            rooms.enablePanicEvents($scope.room);
        };

        $scope.disableRoom = function() {
            rooms.disablePanicEvents($scope.room);
        };

        $scope.uploadImage = function($event) {
            // Actually this should be an ng-directive, needs refactoring at some point of time
            var fileInput = jQuery($event.currentTarget.children[0]);
            fileInput.off().on("change", function() {
                var formData = new FormData();
                formData.append("image", this.files[0]);
                $http.post("/upload", formData, {
                        headers: {
                            "Encoding-Type" : "multipart/form-data"
                        }
                    }).then(function(response) {
                        console.log(response);
                    });
            });
            $timeout(function() { // Without this the event will be triggered in the current digest, which might blow up things
                fileInput.click(); // and causes an exception
                return true;
            });
        };        
    }
]);