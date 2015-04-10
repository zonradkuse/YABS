clientControllers.controller("courseController", ["$scope", "$routeParams", "rooms", "$location",
                                                    "authentication", "rpc", "$timeout", "$http",
    function($scope, $routeParams, rooms, $location, authentication, rpc, $timeout, $http) {
        authentication.enforceLoggedIn();
            $scope.Math = window.Math;
            $scope.chartist = {};
            $scope.chartist.options = {
                lineSmooth: false, // disable interpolation
                axisX: {
                    showLabel: false // disable x label as data grows
                },
                axisY: {
                    labelInterpolationFnc: function(val) { // do not show half panics
                        return (val % 1 === 0 ? val : ' ');
                    }
                }
            };

            $scope.chartist.lineData = {labels: [], series: [[]]};
            $scope.orderProp = '-votes';

        $scope.$watch(function() { return rooms.getById($routeParams.courseid); }, function(room) {
            $scope.room = room;
            $scope.imageUploads = {};
            $scope.uploading = {};
            $scope.panics = 0;
            $scope.activeUsers = 0;
            $scope.importantQuestions = 0;
            // RPC shouldnt be handled here but is neccessary due to bad server api design (missing room ids in broadcasts)
            rpc.attachFunction("room:livePanic", function(data) {
                $scope.$apply(function() {
                    $scope.panics = data.panics;
                    $scope.activeUsers = data.activeUsers;
                    $scope.importantQuestions = data.importantQuestions;
                });
            });

            rpc.attachFunction("room:panicStatus", function(data) {
                $scope.$apply(function() {
                    $scope.room.isRoomRegistered = data.isEnabled;
                    $scope.room.hasUserPanic = data.hasUserPanic;
                });  
            }); 

            if($scope.room !== undefined) { // Room might be undefined while loading
                rooms.hasUserAccess($scope.room).then(function(allowed) {
                    if(!allowed) {
                        $window.location = "/";
                    }
                });
                rooms.enter($scope.room);
                rooms.getQuestions($scope.room);    
                $scope.docentLogin = "/roles/admin/" + $scope.room._id;
                rooms.getAccessLevel($scope.room).then(function(level) {
                    if(level > 1) {
                        $scope.showAdmin = true;
                        $("#statModal").off().on("shown.bs.modal", function() {
                            rooms.getPanicGraph($scope.room).then(function(data) {
                                var labels = [];
                                var values = [];
                                for (var i = 0; i < data.graph.length; i++) {
                                    var date = (new Date(data.graph[i].time)).toLocaleTimeString();
                                    labels.push(date);
                                    values.push({ value: data.graph[i].panics, meta: date });
                                }
                                $scope.chartist.lineData = { labels: labels, series: [{
                                        name: "Panics",
                                        data: values }
                                ]};

                                // modified chartist example
                                var $chart = $('.ct-chart');

                                var $toolTip = $chart
                                    .find('.tooltip');

                                $('.ct-chart').on('mouseenter', '.ct-point', function() {
                                    var $point = $(this);
                                    var count = $point.attr('ct:value');
                                    var time = $point.attr('ct:meta');
                                    // this is bad but scope variables are too slow. gotta go for an angular module
                                    $toolTip.html('<div class="panel-heading">' + time + 
                                        '</div><div class="panel-body">' + count + ' Panics</div>').show();
                                });

                                $chart.on('mouseleave', '.ct-point', function() {
                                    $toolTip.hide();
                                });

                                $chart.on('mousemove', function(event) {
                                    $toolTip.css({
                                        left: (event.offsetX || event.originalEvent.layerX) - $toolTip.width() / 2 + 14,
                                        top: (event.offsetY || event.originalEvent.layerY) - $toolTip.height()
                                    });
                                });

                                $timeout(function() {
                                    window.dispatchEvent(new Event("resize"));
                                    // Rerenders chartist (crappy solution, but the directive doesnt allow direct access)
                                    return true;
                                });                                
                            });
                        });
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
            if($scope.imageUploads.question === undefined) {
                $scope.imageUploads.question = [];
            }
            rooms.addQuestion($scope.room, this.questionText, $scope.imageUploads.question);
            this.questionText = "";
            $scope.imageUploads.question = undefined;
        };

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

        $scope.uploadImage = function($event, identifier) {
            // Actually this should be an ng-directive, needs refactoring at some point of time
            var fileInput = jQuery($event.currentTarget.children[0]);
            fileInput.off().on("change", function() {
                var formData = new FormData();
                formData.append("image", this.files[0]);
                $scope.uploading[identifier] = true;
                $http.post("/upload", formData, {
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
]);