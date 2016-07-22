app.directive('angucomplete', ["$parse", "$document", "$http", "$sce", "$timeout", 'DataService', function ($parse, $document, $http, $sce, $timeout, DataService) {
    return {
        restrict: 'E',
        scope: {
            id: "@id",
            placeholder: "@placeholder",
            ngModel: "=",
            param: "=param",
            titleField: "@titlefield",
            inputClass: "@inputclass",
            searchFields: "@searchfields",
            minLengthUser: "@minlength",
            matchClass: "@matchclass"
        },
        template: '<div id ="mydiv" class="angucomplete-holder" title="header" style="width:200px;" ng-mouseleave="offScreen()" ng-mouseenter="onScreen()">' +
        '<input id="{{id}}_value" ng-model="searchStr" type="text" style="width:200px;" placeholder="{{placeholder}}" ng-blur="hideResults()"  class="{{inputClass}}" ng-blur="hideResults()"/>' +
        '<div id="{{id}}_dropdown" class="angucomplete-dropdown" ng-if="showDropdown">' +
            '<ul ng-mouseleave="offScreen()" ng-mouseenter="onScreen()"><li ng-repeat="result in results" class="angucomplete-row" ng-click="cancelClose($event)" >' +
                        '<div class="hs-checkbox"><input type="checkbox" id="{{result.title}}" ng-blur="hideResults(this)" ng-model="result.selected" ng-change="selectVal(result,$index)"> <label for="{{result.title}}"> </label><span>{{ result.title }}</span></div></li></ul>'
            + '</div>' +
        '</div>' +
    '</div>',

        link: function ($scope, elem, attrs) {
            $scope.lastSearchTerm = null;
            $scope.currentIndex = null;
            $scope.searchTimer = null;
            $scope.hideTimer = null;
            $scope.searching = false;
            $scope.minLength = 2;
            $scope.searchStr = null;
            // $scope.ngModel = [];
            var params = attrs.param;
            var flag = false;
            $scope.$watch("param", function (val) {
                $scope.GetData($scope.param);

            });
            $scope.GetData = function (param) {
                DataService.GetData(param).then(
               function (data) {
                   $scope.data = [];
                   $scope.data = angular.fromJson(data.data)
               },
              function (error) {
                  console.log(error);
              });
            }
            if ($scope.minLengthUser && $scope.minLengthUser != "") {
                $scope.minLength = $scope.minLengthUser;
            }

            isNewSearchNeeded = function (newTerm, oldTerm) {
                return newTerm.length >= $scope.minLength && newTerm != oldTerm
            }

            $document.bind('click', function () {
                $scope.showDropdown = false;
                $scope.$apply();
            });

            $scope.processResults = function (responseData, str) {
                if (responseData && responseData.length > 0) {
                    $scope.results = [];

                    var titleFields = [];
                    if ($scope.titleField && $scope.titleField != "") {
                        titleFields = $scope.titleField.split(",");
                    }

                    for (var i = 0; i < responseData.length; i++) {
                        // Get title variables
                        var titleCode = [];

                        for (var t = 0; t < titleFields.length; t++) {
                            titleCode.push(responseData[i][titleFields[t]]);
                        }

                        var text = titleCode.join(' ');
                        if ($scope.matchClass) {
                            var re = new RegExp(str, 'i');
                            var strPart = text.match(re)[0];
                            text = $sce.trustAsHtml(text.replace(re, '<span class="' + $scope.matchClass + '">' + strPart + '</span>'));
                        }

                        var resultRow = {
                            title: text,
                            id: responseData[i].SupplierId,
                            originalObject: responseData[i]
                        }
                        $scope.results[$scope.results.length] = resultRow;
                    }


                } else {
                    $scope.results = [];
                }
            };
            $scope.selectVal = function (objModel) {
                if (typeof ($scope.ngModel) != "undefined" && $scope.ngModel) {
                    if (objModel.selected != undefined) {
                        if (objModel.selected == true) {
                            $scope.ngModel.push(objModel);

                        }
                        else {
                            $scope.ngModel.splice($scope.ngModel.indexOf(objModel), 1);
                        }
                    }
                    else {
                        $scope.ngModel = [];
                        $scope.ngModel.push(objModel);
                    }
                }
                else {
                    $scope.ngModel = [];
                };
            };
            $scope.offScreen = function ($event) {
                var selectedData = $scope.ngModel;
                flag = true;;
            };
            $scope.onScreen = function () {
                flag = false;
            };
            $scope.searchTimerComplete = function (str) {
                // Begin the search
                if (str.length >= $scope.minLength) {
                    if ($scope.data != undefined || $scope.data.length > 0) {
                        var searchFields = $scope.searchFields.split(",");
                        var matches = [];
                        for (var i = 0; i < $scope.data.length; i++) {
                            var match = false;

                            for (var s = 0; s < searchFields.length; s++) {
                                match = match || (typeof $scope.data[i][searchFields[s]] === 'string' && typeof str === 'string' && $scope.data[i][searchFields[s]].toLowerCase().indexOf(str.toLowerCase()) >= 0);
                            }

                            if (match) {
                                matches[matches.length] = $scope.data[i];
                            }
                        }
                        $scope.searching = false;
                        $scope.processResults(matches, str);

                    }
                }
            }
            $scope.hideResults = function (item) {
                if (flag) {
                    $scope.showDropdown = false;
                }
            };

            $scope.resetHideResults = function () {
                flag = false;
            };

            $scope.hoverRow = function (index) {
                $scope.currentIndex = index;
            }

            $scope.keyPressed = function (event) {
                if (!(event.which == 38 || event.which == 40 || event.which == 13)) {
                    if (!$scope.searchStr || $scope.searchStr == "" || $scope.searchStr.length < 3) {
                        $scope.showDropdown = false;
                        $scope.lastSearchTerm = null
                    } else if (isNewSearchNeeded($scope.searchStr, $scope.lastSearchTerm)) {
                        $scope.lastSearchTerm = $scope.searchStr
                        $scope.showDropdown = true;
                        $scope.currentIndex = -1;
                        $scope.results = [];
                        $scope.searching = true;
                        $scope.searchTimerComplete($scope.searchStr);
                    }
                } else {
                    //event.preventDefault();
                }

            }
            $scope.cancelClose = function ($event) {
                $event.stopPropagation();
            }
            var inputField = elem.find('input');

            inputField.on('keyup', $scope.keyPressed);

            elem.on("keyup", function (event) {
                if (event.which === 40) {
                    if ($scope.results && ($scope.currentIndex + 1) < $scope.results.length) {
                        $scope.currentIndex++;
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                    $scope.$apply();
                } else if (event.which == 38) {
                    if ($scope.currentIndex >= 1) {
                        $scope.currentIndex--;
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                } else if (event.which == 13 || event.which == 8) {
                    if ($scope.results && $scope.currentIndex >= 0 && $scope.currentIndex < $scope.results.length) {
                        event.preventDefault;
                        event.stopPropagation();
                    } else {
                        if (event.which == 13 || $scope.searchStr.length < 3) {
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
                } else {
                    $scope.$apply();
                }
            });

        }
    };
}]);

