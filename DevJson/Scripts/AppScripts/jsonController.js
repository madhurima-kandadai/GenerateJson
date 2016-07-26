/// <reference path="../../Html/templates/EditPropertyDialog.tpl.html" />

app.controller('jsonController', function ($scope, $http, ngDialog) {

    $scope.swaggerJson = [];
    $scope.swaggerEditorJson = [];
    $scope.models = [];
    $scope.tableViewModels = [];
    $scope.modelNames = [];
    $scope.showProperty = false;
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
        var index = $scope.models.findIndex(x => x.model.toLowerCase() == $scope.model.toLowerCase())
        if (index != -1) {
            alert('Duplicate Model Name');
        } else {
            $scope.models.push({
                "model": $scope.model,
                "properties": []
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
        var index = $scope.models.findIndex(x => x.model == property.propertyModelName);
        var propIndex = $scope.models[index].properties.findIndex(x => x.propertyName == property.propertyName);
        if (propIndex == -1) {
            var dataTypeType = $scope.dataTypes.findIndex(x => x.value == property.dataType)
            $scope.models[index].properties.push({
                "propertyName": property.propertyName,
                "dataType": property.dataType,
                "required": property.required,
                "list": property.list,
                "dataTypeType": $scope.dataTypes[index].type
            });
            $scope.SwaggerJsonGeneration();
        }
        else {
            alert('Duplicate Property')
        }
        $scope.addProperty.propertyName = null;
        $scope.addProperty.dataType = "";
        $scope.addProperty.list = false;
        $scope.addProperty.required = false;
    }

    $scope.SwaggerJsonGeneration = function () {
        var index = 0;
        $scope.swaggerEditorJson = [];
        angular.forEach($scope.models, function (model, $index) {
            index = $index;
            $scope.swaggerEditorJson.push({
                [model.model]: {
                    "type": "object",
                    "required": [],
                    "properties": []
                }
            });
            angular.forEach(model.properties, function (property) {
                if (property.dataTypeType == 'primary') {
                    if (property.list) {
                        $scope.swaggerEditorJson[index][model.model].properties.push({
                            [property.propertyName]: {
                                "type": "array",
                                "items": {
                                    "type": property.dataType
                                }
                            }
                        });
                    }
                    else {
                        $scope.swaggerEditorJson[index][model.model].properties.push({
                            [property.propertyName]: {
                                "type": property.dataType
                            }
                        });
                    }
                } else if (property.dataTypeType == 'secondary') {
                    if (property.list) {
                        $scope.swaggerEditorJson[index][model.model].properties.push({
                            [property.propertyName]: {
                                "type": "array",
                                "items": {
                                    "$ref": property.dataType
                                }
                            }
                        });
                    }
                    else {
                        $scope.swaggerEditorJson[index][model.model].properties.push({
                            [property.propertyName]: {
                                "$ref": property.dataType
                            }
                        });
                    }
                }

                if (property.required) {
                    $scope.swaggerEditorJson[index][model.model].required.push(property.propertyName);
                }
            });
        });
        $scope.tableViewModels = JSON.stringify($scope.swaggerEditorJson, null, 1);
    };

    $scope.EditProperty = function (property) {
        $scope.editElement = {
            model: $scope.addProperty.propertyModelName,
            propertyName: property.propertyName,
            dataType: property.dataType,
            list: property.list,
            required: property.required,
        }
        ngDialog.open({
            template: 'EditPropertyDialog',
            scope: $scope,
            closeByDocument: false,
            closeByEscape: true
        });
    };

    $scope.updateProperty = function (property) {
        var index = $scope.models.findIndex(x => x.model == property.model);
        var dataTypeType = $scope.dataTypes.findIndex(x => x.value == property.dataType);
        var propertyIndex = $scope.models[index].properties.findIndex(x => x.propertyName == property.propertyName);
        $scope.models[index].properties[propertyIndex].dataType = property.dataType;
        $scope.models[index].properties[propertyIndex].list = property.list;
        $scope.models[index].properties[propertyIndex].required = property.required;
        $scope.models[index].properties[propertyIndex].dataTypeType = $scope.dataTypes[propertyIndex].type;
        $scope.SwaggerJsonGeneration();
        $scope.closengDialog();
    };

    $scope.closengDialog = function () {
        ngDialog.close();
    }
    $scope.GetProperties = function (modelName) {
        $scope.showProperty = true;
        $scope.addProperty.propertyModelName = modelName;
        var index = $scope.models.findIndex(x => x.model == modelName)
        $scope.singleModelProperties = $scope.models[index];
    }

    $scope.GoToHome = function () {
        $scope.showProperty = false;
    }

    $scope.DeleteProperty = function (modelName, propertyName) {
        var index = $scope.models.findIndex(x => x.model == modelName);
        $scope.models[index].properties = jQuery.grep($scope.models[index].properties, function (property) {
            return property.propertyName != propertyName;
        });
        $scope.SwaggerJsonGeneration();

    };
});