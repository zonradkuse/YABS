// This file is part of YABS. See License for more information

clientControllers.directive('mathjaxBind', function() {
    return { // http://jsfiddle.net/spicyj/YpqVp/
        restrict: 'A',
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            $scope.$watch($attrs.mathjaxBind, function(value) {
                $element.text(value === undefined ? "" : value);
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, $element[0]]);
            });
        }]
    };
});
