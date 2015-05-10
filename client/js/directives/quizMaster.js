/* global clientControllers */
/* global $ */
clientControllers.directive('quizMaster', ['$timeout', 'rooms', function($timeout, rooms){
	return {
		restrict: 'E',
		templateUrl: 'quiz_master.html',
		link: {
			pre: function(scope, elem, attr){
				//define default data for initialization and define options
				scope.optionQuiz = "Umfragebeschreibung";
				scope.id = 0;
				scope.editItem = undefined;
				scope.items = [{
					tId: scope.id,
					type: "checkbox",
					answer: "wundertoll...",
					active: false
				}];
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

				scope.delete = function(item){
					scope.items.splice(scope.items.indexOf(item), 1 );
					scope.editItem = undefined;
				};

			},
			post: function(scope, elem, attr){
				/*$('#quizMasterModal').hide().modal({
					keyboard: false,
					backdrop: 'static'
				});*/
			}
		}
	};
}]);