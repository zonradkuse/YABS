clientControllers.directive('arsCreator', ['$timeout', 'rooms', function($timeout, rooms){
	return {
		restrict: 'E',
		templateUrl: 'ars_creator.html',
		controller: 'arsMaster',
		link: {
			pre: function(scope, elem, attr){
				//define default data for initialization and define options
				scope.optionQuiz = "Umfragebeschreibung";
                scope.sending = false;
				scope.id = 0;
				scope.items = [{
					_id: scope.id,
					type: "checkbox",
					answer: "wundertoll...",
					active: false
				}];
				scope.editItem = scope.items[0];
				scope.type = "";

				scope.reset = function () {
					scope.optionQuiz = "Umfragebeschreibung";
					scope.qsInputText = "";
					scope.editItem = "";
					scope.type = "";
					scope.items = [];
                    scope.qsRuntime = "";
                    scope.sending = false;
				};

				scope.addCheckbox = function() {
					scope.type = "checkbox";
					scope.addItem();
				};

				scope.addRadiobox = function() {
					scope.type = "radiobox";
					scope.addItem();
				};

				scope.addTextfield = function() {
					scope.type = "text";
					scope.addItem();
				};

				scope.addItem = function() {
					var item = {
						_id: scope.id++,
						active: false,
						answer: "",
						type: scope.type
					};
					scope.items.push(item);
					scope.editAnswer(item);
				};

				scope.editAnswer = function(item) {
					scope.editItem = item;
				};

				scope.delete = function(item){
					scope.items.splice(scope.items.indexOf(item), 1 );
					scope.editItem = undefined;
				};

                scope.sendPoll = function () {
                    var obj = {};
                    obj.description = scope.qsInputText;
                    obj.answers = [];
                    for (var i = 0; i < scope.items.length; i++) {
                        var ans = {};
                        switch (scope.items[i].type) { // this is needed as the first html-angular layout differs slightly from the server implementation
                            case "checkbox":
                                ans.checkbox = true;
                                break;
                            case "radiobox":
                                ans.radiobox = true;
                                break;
                            case "text":
                                ans.text = true;
                                break;
                            default:
                                ans.checkbox = true;
                                break;
                        }
                        ans.description = scope.items[i].answer;
                        obj.answers.push(ans);
                    }
                    obj.duration = parseInt(scope.qsRuntime);
                    scope.sending = true;
                    rooms.createPoll(scope.room, obj, function(resp) {
                        if(resp && resp.status) {
                            scope.$apply(function () {
                                scope.sending = false;
                                scope.reset();
                            });
                            $('#quizMasterModal').modal('hide');
                        } else {
                            scope.sending = false;
                        }
                    });
                };

			},
			post: function(scope, elem, attr){
				$('#quizMasterModal').modal({
					keyboard: false,
					backdrop: 'static',
					show : false
				});
                $('#quizMasterModal').off().on("show.bs.modal", function () {
                    scope.$apply(function () {
                        scope.reset();
                    });
                });
			}
		}
	};
}]);