/// <reference path="../../Html/templates/EditPropertyDialog.tpl.html" />

app.controller('jsonController', ['$scope', '$http', 'ngDialog', 'pathService', 'definitionService', function ($scope, $http, ngDialog, pathService, definitionService) {

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
        value: 'integer',
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
    },
    {
        value: 'boolean',
        name: 'Boolean',
        type: 'primary'
    }, {
        value: 'number',
        name: 'Number',
        type: 'primary'
    }];

    //Add Model 
    $scope.AddModel = function () {
        var index = $scope.models.findIndex(x => x.model.toLowerCase() == this.model.toLowerCase())
        if (index != -1) {
            alert('Duplicate Model Name');
        } else {
            $scope.models.push({
                "model": this.model,
                "properties": []
            });
            $scope.dataTypes.push({
                value: '#/definitions/' + this.model,
                name: this.model,
                type: 'secondary'
            });
            $scope.modelNames.push(this.model);
            $scope.showProperty = true;
            $scope.GetProperties(this.model);
            $scope.addProperty.propertyModelName = this.model;
        }
        this.model = '';
    };

    // Add property to model
    $scope.AddPropertyToModel = function (property) {
        var index = $scope.models.findIndex(x => x.model == property.propertyModelName);
        var propIndex = $scope.models[index].properties.findIndex(x => x.propertyName.toLowerCase() == property.propertyName.toLowerCase());
        if (propIndex == -1) {
            var dataTypeType = $scope.dataTypes.findIndex(x => x.value == property.dataType)
            $scope.models[index].properties.push({
                "propertyName": property.propertyName,
                "dataType": property.dataType,
                "required": property.required,
                "list": property.list,
                "dataTypeType": $scope.dataTypes[dataTypeType].type
            });
            $scope.test = $scope.models;
            console.log($scope.test);
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

    // Generate Swagger Json from the models created from the UI
    $scope.SwaggerJsonGeneration = function () {
        $scope.swaggerEditorJson = {};
        angular.forEach($scope.models, function (model, $index) {
            $scope.swaggerEditorJson[model.model] = {
                "type": "object",
                "required": [],
                "properties": {}
            };
            angular.forEach(model.properties, function (property) {
                if (property.dataTypeType == 'primary') {
                    if (property.list) {
                        $scope.swaggerEditorJson[model.model].properties[property.propertyName] = {
                            "type": "array",
                            "items": {
                                "type": property.dataType
                            }
                        };
                    }
                    else {
                        $scope.swaggerEditorJson[model.model].properties[property.propertyName] = {
                            "type": property.dataType
                        }
                    }
                } else if (property.dataTypeType == 'secondary') {
                    if (property.list) {
                        $scope.swaggerEditorJson[model.model].properties[property.propertyName] = {
                            "type": "array",
                            "items": {
                                "$ref": property.dataType
                            }
                        };
                    }
                    else {
                        $scope.swaggerEditorJson[model.model].properties[property.propertyName] = {
                            "$ref": property.dataType
                        };
                    }
                }

                if (property.required) {
                    $scope.swaggerEditorJson[model.model].required.push(property.propertyName);
                }
            });
        });
        $scope.tableViewModels = JSON.stringify($scope.swaggerEditorJson, null, 1);
    };

    //Edit property of a model - open dialog
    $scope.EditProperty = function (property) {
        $scope.editElement = {
            model: $scope.addProperty.propertyModelName,
            propertyName: property.propertyName,
            dataType: property.dataType,
            list: property.list,
            required: property.required,
        }
        ngDialog.open({
            templateUrl: './templates/EditPropertyDialog.tpl.html',
            scope: $scope,
            closeByDocument: false,
            closeByEscape: true
        });
    };

    // update property on click of save from the edit dialog
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

    //close dialog
    $scope.closengDialog = function () {
        ngDialog.close();
    }

    // Get the list of properties for model to show in the table 
    $scope.GetProperties = function (modelName) {
        $scope.showProperty = true;
        $scope.addProperty.propertyModelName = modelName;
        var index = $scope.models.findIndex(x => x.model == modelName)
        $scope.singleModelProperties = $scope.models[index];
    }

    //Open add model 
    $scope.GoToHome = function () {
        $scope.showProperty = false;
    }

    // Delete property from the model
    $scope.DeleteProperty = function (modelName, propertyName) {
        var index = $scope.models.findIndex(x => x.model == modelName);
        $scope.models[index].properties = jQuery.grep($scope.models[index].properties, function (property) {
            return property.propertyName != propertyName;
        });
        $scope.SwaggerJsonGeneration();
    };

    // Generate models and properties from the swagger file.
    $scope.CreateModelsFromJson = function () {
        $http({
            method: 'GET',
            url: "../JsonData/swaggerScript.json"
        })
            .success(function (response) {
                console.log(response);
                $scope.swaggerCode = response;
                $scope.tableViewModels = JSON.stringify($scope.swaggerCode, null, 2);
                $scope.modelsGenerate = [];
                var keysList = Object.keys($scope.swaggerCode);
                angular.forEach(keysList, function (key) {
                    $scope.dataTypes.push({
                        name: key,
                        value: '#/definitions/' + key,
                        type: 'secondary'
                    });
                });
                angular.forEach(keysList, function (key, $index) {
                    $scope.modelsGenerate.push({
                        "model": key,
                        "properties": []
                    });
                    $scope.modelNames.push(key);
                    var propList = Object.keys($scope.swaggerCode[key].properties);
                    var mainObject = $scope.swaggerCode[key].properties;
                    angular.forEach(propList, function (propKey) {
                        var dataType = '';
                        if (mainObject[propKey].type == "array") {
                            if (mainObject[propKey].items.type != undefined) {
                                dataType = mainObject[propKey].items.type
                            }
                            else {
                                dataType = mainObject[propKey].items.$ref;
                            }
                        }
                        else {
                            if (mainObject[propKey].type != undefined) {
                                dataType = mainObject[propKey].type
                            }
                            else {
                                dataType = mainObject[propKey].$ref;
                            }
                        }
                        var dataTypeTypeIndex = $scope.dataTypes.findIndex(x => x.value == dataType);
                        var required = false;
                        if ($scope.swaggerCode[key].required != undefined) {
                            if ($scope.swaggerCode[key].required.findIndex(x => x == propKey) != -1) {
                                required = true;
                            }
                        }
                        var dataTypeType = $scope.dataTypes[dataTypeTypeIndex].type;
                        $scope.modelsGenerate[$index].properties.push({
                            "propertyName": propKey,
                            "dataType": dataType,
                            "required": required,
                            "list": mainObject[propKey].type == "array" ? true : false,
                            "dataTypeType": dataTypeType
                        });
                    });
                });
                $scope.models = $scope.modelsGenerate;
            }).error(function (response) {
            });
    };

    // for paths--------------------------------------------------
    $scope.paths = [];
    $scope.edit = false;
    $scope.test = { methodName: '' };
    $scope.showPaths = false;
    $scope.httpVerbs = [{
        'name': "GET",
        'value': 'get'
    },
    {
        'name': "PUT",
        'value': 'put'
    },
    {
        'name': "POST",
        'value': 'post'
    },
    {
        'name': "DELETE",
        'value': 'delete'
    }
    ];

    $scope.queryParameters = [];
    $scope.requestHeaders = [];
    $scope.responses = [];

    $scope.addNewQueryParameter = function () {
        $scope.queryParameters.push({
            "in": "query",
            "parameterName": "",
            "parameterType": "",
            "required": "",
            "list": ""
        });
    };

    $scope.addNewRequestHeader = function () {
        $scope.requestHeaders.push({
            "in": "header",
            "parameterName": "",
            "parameterType": "",
            "required": "",
            "list": ""
        });
    };

    $scope.addnewResponse = function () {
        $scope.responses.push({
            "status": "",
            "output": "",
            "list": "",
            "description": ""
        });
    };

    $scope.responsesList = [{
        "name": "200 OK",
        "value": "200"
    },
    {
        "name": "404 Not Found",
        "value": "404"
    },
    {
        "name": "405 Method Not Found",
        "value": "405"
    },
    {
        "name": "500 Internal Server Error",
        "value": "500"
    }
    ];

    $scope.AddPath = function () {
        $scope.paths = pathService.AddPath($scope.paths, this.path);
        $scope.path = '';
        $scope.showPaths = true;
    };

    $scope.AddMethodToPath = function (path, methodName, queryParameters, requestHeaders, responses) {
        var index = $scope.paths.findIndex(x => x.pathName == path);
        var length = $scope.paths[index].methods.length;
        $scope.paths[index].methods.push({
            "methodName": methodName,
            "parameters": [],
            "responses": []
        });
        angular.forEach(queryParameters, function (qParam) {
            $scope.paths[index].methods[length].parameters.push({
                "parameterName": qParam.parameterName,
                "dataType": qParam.dataType,
                "in": qParam.in,
                "required": qParam.required != null ? qParam.required : false
            });
        });

        angular.forEach(requestHeaders, function (qParam) {
            $scope.paths[index].methods[length].parameters.push({
                "parameterName": qParam.parameterName,
                "dataType": qParam.dataType,
                "in": qParam.in,
                "required": qParam.required != null ? qParam.required : false
            });
        });

        angular.forEach(responses, function (response) {
            $scope.paths[index].methods[length].responses.push({
                "status": response.status,
                "output": response.output,
                "list": response.list != null ? response.list : false,
            });
        });
        $scope.ClearData();
    };

    $scope.GoToHomeServices = function () {
        $scope.showPaths = false;
    };

    $scope.GetMethodDetails = function (pathName, methodName) {
        $scope.edit = true;
        $scope.showPaths = true;
        var pathIndex = $scope.paths.findIndex(x => x.pathName == pathName);
        var methodIndex = $scope.paths[pathIndex].methods.findIndex(x => x.methodName == methodName);
        var methodObject = $scope.paths[pathIndex].methods[methodIndex];
        $scope.test.methodName = methodName;
        $scope.requestHeaders = methodObject.parameters;
        $scope.queryParameters = methodObject.parameters;
        $scope.responses = methodObject.responses;
    };

    $scope.ClearData = function () {
        $scope.showPaths = true;
        $scope.edit = false;
        $scope.test.methodName = "";
        $scope.queryParameters = [];
        $scope.requestHeaders = [];
        $scope.responses = [];
    };
}]);