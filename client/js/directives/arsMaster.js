clientControllers.directive('arsCreator', ['$timeout', 'rooms', function($timeout, rooms){
	return {
		restrict: 'E',
		templateUrl: 'ars_creator.html',
		controller: 'arsMaster',
		link: {
			pre: function(scope, elem, attr){
				//define default data for initialization and define options
				scope.optionQuiz = "Umfragebeschreibung";
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
						type: scope.type,
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

			},
			post: function(scope, elem, attr){
				$('#quizMasterModal').modal({
					keyboard: false,
					backdrop: 'static',
					show : false
				});
			}
		}
	};
}]);