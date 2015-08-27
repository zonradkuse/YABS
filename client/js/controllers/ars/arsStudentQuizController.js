clientControllers.controller('studentQuizController', ['rpc','rooms', '$scope', function (rpc, $scope, rooms) {
	
	rpc.attachFunction("quiz:do", function(data){
		//$scope.$apply(function() {
			$scope.quiz = data.quiz;
			console.log(JSON.stringify(data.quiz,null,2));
       		$("#quizStudentModal").modal('show');
       	//});
    });

}]);