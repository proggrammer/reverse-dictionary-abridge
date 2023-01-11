angular.module('myApp', [])
    .controller('MyController', function($scope, $http) {
        //drawCanvas();
        $http.get("corpus/tries.json")
            .then(function(response) {
                window.tries = response.data;                            //1. winodw state
            });
        $http.get("corpus/dict.json")
            .then(function(responseD) {
                const dictionary = responseD.data;
                $http.get("corpus/hashes.json")
                    .then(function(responseH) {
                        window.canvasState = {};                     //2. winodw state
                        const hashes = responseH.data;
                        window.hashes = hashes;                         //3. winodw state
                        window.dictionary = dictionary;                 //4. winodw state
                        var x = document.getElementById("loader");
                        x.style.display = "none";
                        drawCloud([], dictionary);
                    });
            });
        $scope.changeSearch = utilChangeSearch;
        $scope.moveCursor = utilMoveCursor;
        $scope.onFocus = utilFocus;
        $scope.onFocusout = utilFocusout;
    }).directive('contenteditable', function() {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function(scope, elm, attr, ngModel) {
            function updateViewValue() {
                ngModel.$setViewValue(this.innerHTML);
            }
            elm.on('keyup', updateViewValue);
            scope.$on('$destroy', function() {
                elm.off('keyup', updateViewValue);
            });
            ngModel.$render = function() {
                elm.html(ngModel.$viewValue);
            }
        }
    }
});