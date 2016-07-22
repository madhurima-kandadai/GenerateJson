app.directive('customSelect', function ($compile) {
    var directive = {};
    var singleTemplate = '<div class="btn-group"><button class="btn button-label btn-info" style="{{customStyle}}">{{currentItemLabel}}</button><button class="btn btn-info dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>' +
                         '<ul class="dropdown-menu custom-select-menu" style="max-height:165px;overflow-y:scroll"><li ng-repeat="item in data" ng-click="selectVal(item)">' +
                         '<div class="input-group"><span tabindex="-1"> {{item[textField]}}</span></div></li></ul>';
    var multiTemplate = '<div class="btn-group"><button class="btn button-label btn-info" style="{{customStyle}}">{{currentItemLabel}}</button><button class="btn btn-info dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>' +
                        '<ul class="dropdown-menu custom-select-menu" style="max-height:165px;overflow-y:scroll"><li ng-repeat="item in data" ng-click="cancelClose($event)" >' +
                        '<div class="hs-checkbox"><input type="checkbox" ng-model ="item.selected" ng-model="item.selected" ng-change="selectVal(item,$index)" id="{{item[textField]}}"><label for="{{item[textField]}}"></label> <span class="hs-checkbox-label" tabindex="-1" > {{item[textField]}}</span></div></li></ul>';

    directive.restrict = 'E';  //  used to set if the directive should be activated by a matching HTML element, or an element attribute and A used for same in case of attribute
    directive.require = '^ngModel';
    directive.scope = {
        data: '=',
        textField: '@',
        valueField: '@',
        ngModel: '=',

    };
    
    directive.link = function (scope, element, attrs, ngModelCtrl) {
        if (attrs.customstyle != undefined) {
            scope.customStyle = attrs.customstyle;
        }
        else {
            scope.customStyle = '';
        }
        if (attrs.mode == 'single')
        {
            element.html(singleTemplate);
            element.contents();
            $compile(element.contents())(scope);
        }
        else if (attrs.mode == 'multi') {
            element.html(multiTemplate);
            element.contents();
            $compile(element.contents())(scope);
        }
        else{
            element.html('<span> Error !!</span>');
            element.contents();
            $compile(element.contents())(scope);
        }
        var selectedObject = [];
        // adding watch() function to add the selected item into the text of HTML element
        scope.$watch('ngModel', function (val) {
            if (val.length == 0)
            {
                angular.forEach(scope.data, function (row) {
                    row.selected = false;
                });
            }
            scope.setLabel();
        }, true);
        var valueField = scope.valueField.toString().trim();
        var textField = scope.textField.toString().trim();
        var modelValidation = false;
        var selectedItemValidation = false;
        // function for check scope model validation
        scope.checkModelValidity = function (items) {
            if (typeof (items) == 'undefined' || !items) {
                return false;
            };
            return true;
        };
        modelValidation = scope.checkModelValidity(scope.ngModel);
        scope.setFormValidity = function () {
            if (typeof (attrs.required) != 'undefined') {
                return modelValidation;
            };
            return true;
        };
        ngModelCtrl.$setValidity('noItemSet!', scope.setFormValidity());
        scope.checkSelectedItemValidity = function (item) {
            if (!item) return false;
            if (!item[valueField]) {
                return false;
            };
            if (!item[valueField].toString().trim()) {
                return false;
            };
            return true;
        };
        // Get teh DropDown value
        scope.getItemName = function (item) {
            return item[textField];
        };
        // set the Label on Drop down or Default Text
        scope.setLabel = function () {
            if(typeof(scope.ngModel)=='undefined' || !scope.ngModel || scope.ngModel.length==0)
            {
                scope.currentItemLabel = attrs.defaultText;
            }
            else {
                if (attrs.mode == 'multi') {
                    scope.currentItemLabel = "("+ scope.ngModel.length.toString()+")" + " " + attrs.label;
                }
                else
                {
                    var allItemsString = '';
                    angular.forEach(scope.ngModel, function (item) {
                        allItemsString += item[textField].toString();
                    });
                    scope.currentItemLabel = allItemsString;
                }
            }
        };
        scope.setLabel();
        scope.selectVal = function (objModel) {
            if (typeof (scope.ngModel) != "undefined" && scope.ngModel)
            {
                if (objModel.selected != undefined) {
                    if (objModel.selected == true) {
                        scope.ngModel.push(objModel);
                    }
                    else {
                        scope.ngModel.splice(scope.ngModel.indexOf(objModel), 1);
                    }
                }
                else {
                    scope.ngModel = [];
                    scope.ngModel.push(objModel);
                }
            }
            else {
                scope.ngModel = [];
            };
            modelValidation = scope.checkModelValidity(scope.ngModel);
            selectedItemValidation = scope.checkSelectedItemValidity(objModel);
            ngModelCtrl.$setValidity('noItemsSet!', scope.setFormValidity() && selectedItemValidation);
            scope.setLabel();
            ngModelCtrl.$setViewValue(scope.ngModel);
        };
        scope.cancelClose = function ($event) {
            $event.stopPropagation();
        }
    };
    return directive;
});