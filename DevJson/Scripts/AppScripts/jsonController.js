app.controller('jsonController', function ($scope, $http, ngDialog) {

    $scope.swaggerJson = [];
    $scope.swaggerEditorJson = [];
    $scope.models = [];
    $scope.tableViewModels = [];
    $scope.modelNames = [];
    $scope.addProperty = {
        required: false,
        list: false
    };
    $scope.dataTypes = [{
        value: 'int',
        name: 'Integer',
        type: 'primary'
    }, {
        value: 'string',
        name: 'String',
        type: 'primary'
    }, {
        value: 'DateTime',
        name: 'Date Time',
        type: 'primary'
    }];


    //Add Model 
    $scope.AddModel = function () {
        var exists = false;
        angular.forEach($scope.models, function (obj) {
            if (Object.keys(obj) == $scope.model) {
                exists = true;
            }
        });
        if (exists) {
            alert('Duplicate Model Name');
        } else {
            $scope.models.push({
                [$scope.model]: {
                    "type": "object",
                    "required": [],
                    "properties": []
                }
            });
            $scope.dataTypes.push({
                value: '#/definitions/' + $scope.model,
                name: $scope.model,
                type: 'secondary'
            });
            $scope.modelNames.push($scope.model);
        }
        $scope.model = '';
    };

    // Add property to model
    $scope.AddPropertyToModel = function (property) {
        var dataTypeType = $scope.GetTypeOfDataType(property.dataType);
        var index = 0;
        angular.forEach($scope.models, function (model, $index) {
            if (Object.keys(model).findIndex(x => x == property.propertyModelName) != -1) {
                index = $index;
            }
        });
        //    var index = $scope.models.findIndex(x => Object.keys(x).toLocaleString() == property.propertyModelName.toLocaleString());
        var key = Object.keys($scope.models[index])[0];
        if (property.required === true) {
            $scope.models[index][key].required.push(property.propertyName);
        }
        if (property.list == false) {
            if (dataTypeType == 'primary') {
                $scope.models[index][key].properties.push({
                    [property.propertyName]: {
                        "type": property.dataType
                    }
                });
            } else {
                $scope.models[index][key].properties.push({
                    [property.propertyName]: {
                        "$ref": property.dataType
                    }
                });
            }
        } else {
            if (dataTypeType == 'primary') {
                $scope.models[index][key].properties.push({
                    [property.propertyName]: {
                        "type": "array",
                        "items": {
                            "type": property.dataType
                        }
                    }
                });
            } else {
                $scope.models[index][key].properties.push({
                    [property.propertyName]: {
                        "type": "array",
                        "$ref": {
                            "type": property.dataType
                        }
                    }
                });
            }
        }
        console.log($scope.models);
        $scope.tableViewModels = JSON.stringify($scope.models, null, 2);
        console.log($scope.tableViewModels);
        $scope.addProperty.propertyModelName = "";
        $scope.addProperty.propertyName = null;
        $scope.addProperty.dataType = "";
        $scope.addProperty.list = false;
        $scope.addProperty.required = false;
    }

    $scope.GetTypeOfDataType = function (dataType) {
        var index = $scope.dataTypes.findIndex(x => x.value == dataType);
        return $scope.dataTypes[index].type;
    };

    $scope.EditProperty = function (model, property, hashkey) {
        var index = $scope.dataTypes.findIndex(x => x.value == property.dataType);
        $scope.editElement = {
            hashkey: hashkey,
            modelName: model,
            propertyName: property.name,
            dataType: property.dataType,
            propertyType: property.type == 'list' ? true : false,
            required: property.required,
        }
        ngDialog.open({
            template: 'EditPropertyDialog',
            scope: $scope,
            closeByDocument: false,
            closeByEscape: true
        });
    }

    $scope.GetProperties = function (modelName) {
        var index = $scope.models.findIndex(x => Object.keys(x) == modelName);
        $scope.PropertiesData = $scope.models[index][modelName];
    }
});