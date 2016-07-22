app.directive('customautocomplete',  ["$parse", "$document", "$http", "$sce", "$timeout", 'DataService', function ($parse, $document, $http, $sce, $timeout, DataService) {
    return {
        restrict: 'E',
        scope: {
            "id": "@id",
            "placeholder": "@placeholder",
            "selectedObject": "=selectedobject",
            "searchStr": "@datafield",
            "titleField": "@titlefield",
            "inputClass": "@inputclass",
            "searchFields": "@searchfields",
            "minLengthUser": "@minlength",
            "matchClass": "@matchclass"
        },
        template: '<div class="angucomplete-holder"><input id="{{id}}_value" ng-model="searchStr" type="text" placeholder="{{placeholder}}" class="{{inputClass}}" onmouseup="this.select();" ng-focus="resetHideResults()" style="width:100%"/>' +
            '<div id="{{id}}_dropdown" class="angucomplete-dropdown" ng-if="showDropdown"><div class="angucomplete-searching" ng-show="searching">Searching...</div>' +
            '<div class="angucomplete-searching" ng-show="!searching && (!results || results.length == 0)">No results found</div>' +
            '<div class="angucomplete-row" ng-repeat="result in results" ng-mousedown="selectResult(result)" ng-mouseover="hoverRow()">' +
            '<div class="angucomplete-description" ng-bind-html="result.title"><span>{{result.description}}</span></div></div></div></div>',
        link: function($scope, elem, attrs) {
            $scope.lastSearchTerm = null;
            $scope.currentIndex = null;
            $scope.searching = false;
            $scope.minLength = 3;
            $scope.searchStr = null;
            if ($scope.minLengthUser && $scope.minLengthUser != "") {
                $scope.minLength = $scope.minLengthUser;
            }
            isNewSearchNeeded = function (newTerm, oldTerm) {
                return newTerm.length >= $scope.minLength && newTerm != oldTerm
            };

            $scope.processResults = function (responseData, str) {
                if (responseData && responseData.length > 0) {
                    $scope.results = [];
                    var titleFields = [];
                    if ($scope.titleField && $scope.titleField != "") {
                        titleFields = $scope.titleField.split(",");
                    };
                    for (var i = 0; i < responseData.length; i++) {
                        var titleCode = [];
                        for (var t = 0; t < titleFields.length; t++) {
                            titleCode.push(responseData[i][titleFields[t]]);
                        }
                        var text = titleCode.join(' ');
                        if ($scope.matchClass) {
                            var re = new RegExp(str, 'i');
                            var strPart = text.match(re)[0];
                            text = $sce.trustAsHtml(text.replace(re, '<span>' + strPart + '</span>'));
                        }
                        var resultRow = {
                            title: text,
                            description: responseData[i][titleFields[i]],
                            dataObject: responseData[i]
                        }
                        $scope.results[$scope.results.length] = resultRow;
                    }
                } else {
                    $scope.results = [];
                }
            };
            $scope.GetData = function (str) {
                DataService.GetAotuCompData(str).then(
               function (data) {
                   $scope.localData = [];
                   $scope.localData = angular.fromJson(data.data);
                   $scope.GetMatches(str);
               },
              function (error) {
                  console.log(error);
              });
            }
            $scope.GetMatches = function (str) {
                if (str.length >= $scope.minLength) {
                    if ($scope.localData) {
                        var searchFields = $scope.searchFields.split(",");
                        var matches = [];
                        for (var i = 0; i < $scope.localData.length; i++) {
                            var match = false;
                            for (var s = 0; s < searchFields.length; s++) {
                                match = match || (typeof $scope.localData[i][searchFields[s]] === 'string' && typeof str === 'string' && $scope.localData[i][searchFields[s]].toLowerCase().indexOf(str.toLowerCase()) >= 0);
                            }
                            if (match) {
                                matches[matches.length] = $scope.localData[i];
                            }
                        }
                        $scope.searching = false;
                        $scope.processResults(matches, str);
                    }
                }
            }
            $scope.searchTimerComplete = function (str) {
                // Begin the search
                $scope.GetData(str);
            };

            $scope.hideResults = function () {
                $scope.showDropdown = false;
            };
            $document.bind('click', function () {
                $scope.showDropdown = false;
                $scope.$apply();
            });
            $scope.resetHideResults = function() {
                $scope.showDropdown = true;
            };

            $scope.hoverRow = function(index) {
                $scope.currentIndex = index;
            }

            $scope.keyPressed = function (event) {
                if (!(event.which == 38 || event.which == 40 || event.which == 13)) {
                    if (!$scope.searchStr || $scope.searchStr == "" || $scope.searchStr.length < $scope.minLength) {
                        $scope.showDropdown = false;
                        $scope.lastSearchTerm = null;
                        $scope.results = [];
                    } else {
                        $scope.lastSearchTerm = $scope.searchStr;
                        $scope.showDropdown = true;
                        $scope.currentIndex = -1;
                        $scope.results = [];
                        $scope.searching = true;
                        $scope.searchTimerComplete($scope.searchStr);
                        $scope.$apply();
                    }
                } else {
                   $scope.results = [];
                    //event.preventDefault();
                   $scope.$apply();
                }
            }

            $scope.selectResult = function (result) {
                if ($scope.matchClass) {
                    result.title = result.title.toString().replace(/(<([^>]+)>)/ig, '');
                }
                $scope.searchStr = $scope.lastSearchTerm = result.title;
                $scope.selectedObject = result.dataObject;
                $scope.showDropdown = false;
                $scope.results = [];
            }

            var inputField = elem.find('input');

            inputField.on('keyup', $scope.keyPressed);

            elem.on("keyup", function (event) {
                if(event.which === 40) {
                    if ($scope.results && ($scope.currentIndex + 1) < $scope.results.length) {
                        $scope.currentIndex ++;
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                    $scope.$apply();
                } else if(event.which == 38) {
                    if ($scope.currentIndex >= 1) {
                        $scope.currentIndex --;
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                } else if (event.which == 13 || event.which == 8) {
                    if ($scope.results && $scope.currentIndex >= 0 && $scope.currentIndex < $scope.results.length) {
                        event.preventDefault;
                        event.stopPropagation();
                    } else {
                        if (event.which == 13 || $scope.searchStr.length < $scope.minLength) {
                            $scope.results = [];
                            $scope.$apply();
                            event.preventDefault;
                            event.stopPropagation();
                        }
                    }
                } else if (event.which == 27) {
                    $scope.results = [];
                    $scope.showDropdown = false;
                    $scope.$apply();
                }
                else {
                    $scope.$apply();
                }
            });

        }
    };
}]);

