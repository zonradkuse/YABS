clientControllers.directive('upload', ['$timeout', '$http', function($timeout, $http) {
    return {
        restrict: 'E',
        template:   '<button ng-click="uploadImage($event, identifier)" type="button" class="btn btn-default">' +
                        '<input type="file" accept="image/*" style="display:none">' +
                        '<span class="glyphicon glyphicon-picture" aria-hidden="true">' +
                        '</span>' +
                    '</button>',
        scope: {
            identifier: "=",
            imageUploads: "=",
            uploading: "="
        },
        link: function ($scope) {
            $scope.uploadImage = function($event, identifier) {
                var fileInput = jQuery($event.currentTarget.children[0]);
                fileInput.off().on("change", function() {
                    var formData = new FormData();
                    formData.append("image", this.files[0]);
                    $scope.uploading[identifier] = true;
                    $http.post("upload", formData, {
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
        }
    };
}]);
