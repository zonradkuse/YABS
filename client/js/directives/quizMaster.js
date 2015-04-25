clientControllers.directive('quizMaster', ['$timeout', 'rooms', function($timeout, rooms){
	return {
		restrict: 'E',
		templateUrl: 'quiz_master.html',
		link: {
			pre: function(scope, elem, attr){
				//define default data for initialization and define options
				scope.optionQuiz = "Umfragebeschreibung";
				scope.id = 0;
				scope.editItem = {};
				scope.items = [{
					tId: scope.id,
					type: {
						text : 0,
						radiobox: 0,
						checkbox: 1,
					},
					answer: "wundertoll...",
					active: false
				}];
				scope.type = {
					text: 1,
					radiobox: 1,
					checkbox: 1
				};

				scope.reset = function () {
					scope.optionQuiz = "Umfragebeschreibung";
					scope.qsInputText = "";
					scope.editItem = "";
					scope.type = {
						text: 1,
						radiobox: 1,
						checkbox: 1
					};
					scope.items = [];
				};

				scope.addCheckbox = function() {
					scope.type = {
						text : 0,
						radiobox: 0,
						checkbox: 1,
					};
					scope.addItem();
				};

				scope.addRadiobox = function() {
					scope.type = {
						text : 0,
						radiobox: 1,
						checkbox: 0,
					};
					scope.addItem();
				};

				scope.addTextfield = function() {
					scope.type = {
						text : 1,
						radiobox: 0,
						checkbox: 0,
					};
					scope.addItem();
				};

				scope.addItem = function() {
					var item = {
						tId: scope.id++,
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

				scope.remove = function(item){
					delete scope.items[item];
				};

			},
			post: function(scope, elem, attr){
				$('#quizMasterModal').modal({
					keyboard: false,
					backdrop: 'static'
				});
			}
		}
	};
}]);