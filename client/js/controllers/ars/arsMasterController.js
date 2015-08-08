clientControllers.controller('arsMaster', ['$scope', function($scope) {
	//define default data for initialization and define options
	$scope.optionQuiz = "Umfragebeschreibung";
	$scope.id = 0;
	/*$scope.items = [{
		_id: $scope.id,
		type: "checkbox",
		answer: "wundertoll...",
		active: false
	}];*/

	$scope.questions = [{
		_id: $scope.id,
		question: "",
		type: "quiz",
		answers: [{
			_id: ++$scope.id,
			type: "checkbox",
			answer: "wundertoll...",
			active: false
		}]
	}];

	$scope.editQuestionItem = $scope.questions[0];
	$scope.editAnswerItem = $scope.questions[0].answers[0];
	$scope.answerType = "";
	$scope.type = "poll";
	$scope.dropdownSelection = "Frage 1"; 

	$scope.setSelection = function(selection) {
  		$scope.dropdownSelection = selection;
	};

	$scope.reset = function () {
		$scope.optionQuiz = "Umfragebeschreibung";
		$scope.qsInputText = "";
		$scope.editQuestionItem = "";
		$scope.editAnswerItem = "";
		$scope.answerType = "";
		$scope.type = "poll";
		$scope.questions = [];
	};

	$scope.addCheckbox = function() {
		$scope.answerType = "checkbox";
		$scope.addAnswer();
	};

	$scope.addRadiobox = function() {
		$scope.answerType = "radiobox";
		$scope.addAnswer();
	};

	$scope.addTextfield = function() {
		$scope.answerType = "text";
		$scope.addAnswer();
	};

	$scope.addAnswer = function() {
		var a = {
			_id: ++$scope.id,
			active: false,
			answer: "",
			type: $scope.answerType,
		};
		$scope.editQuestionItem.answers.push(a);
		$scope.editAnswer(a);
	};

	$scope.editAnswer = function(arsAnswer) {
		$scope.editAnswerItem = arsAnswer;
	};

	$scope.deleteAnswer = function(arsQuestion, arsAnswer){
		//$scope.items.splice($scope.items.indexOf(answer), 1 );
		arsQuestion.splice(arsQuestion.answers.indexOf(arsAnswer), 1);
		$scope.editAnswerItem = undefined;
	};

	$scope.addQuestion = function(){
		var q = {
			question: "",
			answers: [],
			type: "quiz"
		};
		$scope.questions.push(q);
		$scope.editQuestion(q);
		$scope.dropdownSelection = "Frage "+($scope.questions.indexOf(q)+1);
	};

	$scope.editQuestion = function(arsQuestion){
		if($scope.editQuestionItem){
			$scope.editQuestionItem.question = $scope.qsInputText;
		}
		$scope.editQuestionItem = arsQuestion;
		if(arsQuestion.answers.length > 0){
			$scope.editAnswer(arsQuestion.answers[0]);
		} else {
			$scope.editAnswerItem = undefined;
		}
	};

}]);