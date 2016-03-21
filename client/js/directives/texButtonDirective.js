// This file is part of YABS. See License for more information

clientControllers.directive('texButton', function() {
    return { 
        restrict: 'E',
        scope : {
            text : '='
        },
        template : '<button type="button" class="btn btn-default" ng-click="text = text + TEXSAMPLE">LaTeX</button>',
        controller: ['$scope', function ($scope) {
            $scope.TEXSAMPLE = " \\( 0 = 0 \\) ";
        }]
    };
});
